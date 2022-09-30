// vim: sts=2:ts=2:sw=2
/* eslint-env es6 */
/* eslint no-console: ["error", { allow: ["log", "warn", "error"] }] */

import '../css/base.scss';

import ethEnsNamehash from 'eth-ens-namehash';

const domainLevels = 2;

const version = process.env.PACKAGE_VERSION || 'unknown';
const infura_key = process.env.INFURA_KEY;

const ipfsBaseUrl = 'https://infura-ipfs.io/ipfs/';

const rpcHost = 'https://mainnet.infura.io/v3/' + infura_key; /* mainnet */
const registry = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'; // see https://docs.ens.domains/ens-deployments

const colorRed = '#ff0000';
const colorDot = '#b3e0f2';

function console_log(msg){
  if (window.console){
    window.console.log('version', version, ':', msg);
  }
}

/* get the hostname from location.hostname by remoming the last parts and by adding '.eth' */
const domainPartsEns = window.location.hostname.split('.');
const domainPartsCurrent = [];
for (let i=0; i < domainLevels ; i++){
  const part = domainPartsEns.pop();
  domainPartsCurrent.unshift(part);
}

const domainEns = domainPartsEns.join('.') + '.eth';
const domainCurrent = domainPartsCurrent.join('.');

/* attach event listeners */

const inputSubmit = document.getElementById('input-submit');
const inputInput = document.getElementById('input-input');
const inputError = document.getElementById('input-error');
const inputDirectlink = document.getElementById('input-directlink');
const inputDirectlinkA = document.getElementById('input-directlink-a');

inputSubmit.addEventListener('click', function (evt) {
  const url = new URL('http://' + inputInput.value);
  inputSubmit.disabled = 'disabled';
  inputInput.disabled = 'disabled';
  const domain = inputInput.value;
  redirect(domain, url, false);
  evt.preventDefault();
});

inputInput.addEventListener('input', function (){
  let url;
  let error;
  let inputValueParts;
  try {
    url = new URL('http://' + inputInput.value);
    inputValueParts = url.host.split('.');
    if ((inputValueParts.length <= 1) || (inputValueParts[inputValueParts.length -1] != 'eth')){ 
      error = 'Domain part must end with ".eth"';
    }
  } catch (err){
    error = 'Must be a valid URL without http(s)://';
  }

  if (error){
    inputError.style.display = 'block';
    inputDirectlink.style.display = 'none';
    inputSubmit.disabled = true;

    inputError.textContent = error;
  } else {
    inputError.style.display = 'none';
    inputDirectlink.style.display = 'block';
    inputSubmit.disabled = false;

    inputValueParts.pop(); // remove 'eth'
    const urlNew = inputValueParts.join('.') + '.' + domainCurrent + url.pathname + url.search + url.hash;
    inputDirectlinkA.textContent = urlNew;
    inputDirectlinkA.href = window.location.protocol + '//' + urlNew;
  }
});

function removePrefix(hex){
  if (hex.substr(0, 2) === '0x')
    return hex.substr(2);
  return hex;
}

function requestPostJson(url, data, done){
  const xhr = new XMLHttpRequest(); // new HttpRequest instance
  xhr.onreadystatechange = function() {
    if (this.readyState == 4){
      let response;
      if (this.status == 200) {
        try {
          response = JSON.parse(this.responseText);
        } catch (err){
          done(err);
          return;
        }
        const result = response.result;

        if (! result){
          done('Geth request failed');
          return;
        }

        if (result.length <= 2){
          done('Invalid response');
          return;
        }

        done(null, result);
      } else {
        try {
          response = JSON.parse(this.responseText);
        } catch (err){
          //
        }
        if (response.error && response.error.message){
          done(response.error.message);
          return;
        }
        done('retured status code ' + this.status);
      }
    }
  };
  xhr.onerror = function () {
    done(xhr.response);
  };
  xhr.open('POST', url);
  xhr.setRequestHeader('Content-Type', 'application/json;charset=utf-8');
  xhr.send(JSON.stringify(data));
}

function lookupResolver(host, nameHash, registry, done){
  const dataGetResolver = {
    'id': 0,
    'jsonrpc': '2.0',
    'params': [
      {
        'to': registry,
        // '0x0178b8bf' = 'resolver(bytes32)' (see https://www.4byte.directory/)
        'data': '0x0178b8bf' + removePrefix(nameHash)
      },
      'latest'
    ],
    'method': 'eth_call'
  };
  requestPostJson(host, dataGetResolver, function(err, result){
    if (err){
      done(err);
      return;
    }
    result = removePrefix(result);
    const resolver = '0x' + result.substr(24);
    done((resolver === '0x0000000000000000000000000000000000000000')? 'invalid resolver' : null, resolver);
  });
}

function lookupContenthash(host, nameHash, resolver, done){

  const dataGetContentHash = {
    'id': 1,
    'jsonrpc': '2.0',
    'params': [
      {
        'to': resolver,
        // "0x3b3b57de" = "addr(bytes32)" (see https://www.4byte.directory/) // works for ethereum.eth (resolver: 0x1da022710df5002339274aadee8d58218e9d6ab5)
        // "0x2dff6941" = "content(bytes32)" (see https://www.4byte.directory/) // works for portalnetwork.eth (resolver: 0x1da022710df5002339274aadee8d58218e9d6ab5)
        // "0xbc1c58d1" = "contenthash(bytes32)"
        'data': '0xbc1c58d1' + removePrefix(nameHash)
      },
      'latest'
    ],
    'method': 'eth_call'
  };
  requestPostJson(host, dataGetContentHash, function(err, result){
    if (err){
      done(err);
      return;
    }
    result = removePrefix(result);
    let contentHash = result.substr(32); // TODO
    contentHash = contentHash.substr(32); // TODO
    const length = contentHash.substr(0, 64); // TODO
    const lengthInt = parseInt(length, 16);
    if (lengthInt === 0){
      done('invalid length');
      return;
    }
    contentHash = contentHash.substr(64).substr(0, lengthInt*2); // TODO
    done(null, contentHash);
  });
}

function contenthashToCID(contenthash){
  // first byte should be 'e3' for ipfs, then '01' - add 'f' to sign hex codes cid
  return 'f' + contenthash.substr(4);
}

/*
  dots:
      #0: no ens name to reslove
      #1: lookupResolver
      #2: lookupContenthash
*/
const dots = 3; // we have 3 dots

function dotSet(dotNr, color){
  document.getElementById('d-dot' + dotNr).setAttribute('fill', color);
}

function dotShowInit(){
  document.getElementById('d-dot').style.display = 'block';
  for (let i=0 ; i < dots ; i ++){
    dotSet(i, '#1ba3d9');
  }
}

function textSet(string, color){
  const text = document.getElementById('d-text');
  text.textContent = string;
  text.setAttribute('fill', color);
}

function initInputField(domain){
  // show input field (hided by default)
  document.getElementById('input').style.display = 'block';

  inputSubmit.disabled = false;
  inputInput.disabled = false;

  inputInput.value = domain;
  
  // triger update of direct link
  const event = new Event('input', {
    bubbles: true,
    cancelable: true,
  });
  inputInput.dispatchEvent(event);
}

function redirect(hostnameENS, url, windowLocationReplace){

  dotShowInit(); // signal that js started to execute

  const noHostName = (hostnameENS == '.eth');
  if (noHostName){
    // no real error - just show the input field
    //dotSet(0, colorRed);
    //textSet('Please Enter a valid hostname:', '#ffffff');
    initInputField('ethereum.eth'); // default domain to show
    return;
  }

  /* show which domain we are resolving */
  dotSet(0, colorDot);
  textSet('Redirect to "' + hostnameENS + '"', '#ffffff');

  /* now calculate the hash of the domain which is then send to our ethereum rpc provider */
  const nameHash = ethEnsNamehash.hash(hostnameENS);

  lookupResolver(rpcHost, nameHash, registry, function(err, resolver){
    if (err){
      dotSet(1, colorRed);
      textSet('Error: Resolver lookup failed for "'+hostnameENS+'"', colorRed);
      initInputField(hostnameENS + url.pathname + url.search + url.hash);
      console_log(err);
      return;
    }
    dotSet(1, colorDot);
    lookupContenthash(rpcHost, nameHash, resolver, function(err, contenthash){
      if (err){
        dotSet(2, colorRed);
        textSet('Error: Contenthash lookup failed for "'+hostnameENS+'"', colorRed);
        initInputField(hostnameENS);
        console_log(err);
        return;
      }
      dotSet(2, colorDot);
      const cid = contenthashToCID(contenthash);
      const urlNew = ipfsBaseUrl + cid + url.pathname + url.search + url.hash;

      if (windowLocationReplace){
        window.location.replace(urlNew);
      } else {
        window.location = urlNew;
      }
    });
  });
}

redirect(domainEns, location, true);

