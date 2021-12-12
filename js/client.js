// vim: sts=2:ts=2:sw=2
/* eslint-env es6 */
/* eslint no-console: ["error", { allow: ["log", "warn", "error"] }] */

import '../css/base.scss';

import ethEnsNamehash from 'eth-ens-namehash';

const removeDomainLevels = 2;

const ipfsBaseUrl = 'https://ipfs.infura.io/ipfs/';

/* mainnet */
const rpcHost = 'https://mainnet.infura.io/v3/<PROJECT_ID>'; // enter here a valid infura PROJECT_ID
const registry = '0x314159265dd8dbb310642f98f50c066173c1259b'; // mainnet

/* ropsten */
//const rpcHost = 'https://ropsten.infura.io/v3/<PROJECT_ID>'; // enter here a valid infura PROJECT_ID
//const registry = '0x112234455c3a32fd11230c42e7bccd4a84e02010'; // ropsten


function console_log(msg){
  if (window.console){
    window.console.log(msg);
  }
}

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
function dotShowInit(){
  document.getElementById('d-dot').style.display = 'block';
  for (let i=0 ; i < dots ; i ++){
    document.getElementById('d-dot' + i).setAttribute('fill', '#1ba3d9');
  }
}

function dotSet(dotNr, error){
  document.getElementById('d-dot' + dotNr).setAttribute('fill', error? '#ff0000' : '#b3e0f2');
  if (error){
    const text = document.getElementById('d-text');
    text.textContent = error;
    text.setAttribute('fill', '#ff0000'); // red = error

    try{
      initInputField();

      console_log(error);
      //sendError('Error: '+ error); // TODO
    } catch (e){/*empty*/}
  }
}

function initInputField(){
  // show input field
  document.getElementById('input').style.display = 'block';

  document.getElementById('input-submit').disabled = false;
  document.getElementById('input-input').disabled = false;

  //document.getElementById('input-submit').disabled = 'disabled';
  //document.getElementById('input-input').disabled = 'disabled';
}

function redirect(hostnameENS){

  dotShowInit(); // signal that js started to execute

  const noHostName = (hostnameParts.join('.') == '');
  dotSet(0, noHostName? 'Please Enter a hostname:' : null);
  if (noHostName){
    return;
  }

  /* show which domain we are resolving */
  document.getElementById('d-text').textContent = 'Redirect to "' + hostnameENS + '"';

  /* now calculate the hash of the domain which is then send to our ethereum rpc provider */
  const nameHash = ethEnsNamehash.hash(hostnameENS);

  lookupResolver(rpcHost, nameHash, registry, function(err, resolver){
    //dotSet(1, err? 'Error: Resolver lookup failed: ' + err : null);
    dotSet(1, err? 'Error: Resolver lookup failed for "'+hostnameENS+'"' : null);
    if (err){
      console_log(err);
      return;
    }
    lookupContenthash(rpcHost, nameHash, resolver, function(err, contenthash){
      //dotSet(2, err? 'Error: Contenthash lookup failed: ' + err : null);
      dotSet(2, err? 'Error: Contenthash lookup failed for "'+hostnameENS+'"' : null);
      if (err){
        console_log(err);
        return;
      }
      const cid = contenthashToCID(contenthash);
      window.location.replace(ipfsBaseUrl + cid + location.pathname);
    });
  });
}

/* get the hostname from location.hostname by remoming the last parts and by adding '.eth' */
const hostname = window.location.hostname;
const hostnameParts = hostname.split('.');
for (let i=0; i < removeDomainLevels ; i++){
  hostnameParts.pop();
}
const hostnameENS = hostnameParts.join('.') + '.eth';
redirect(hostnameENS);

