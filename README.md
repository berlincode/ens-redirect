ens-redirect
============

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/berlincode/ens-redirect/blob/master/LICENSE)

This is a small ENS (ethereum name system) name resolver that redirects to an IPFS gateway.
Works with all browsers.

It should help start adoption of ENS until all major browsers are aware of ENS/IPFS natively.

Test it online:
---------------

This project is online at: [eth-link.com](https://eth-link.com)

So if you want to visit e.g. "**ethereum.eth**" you
can now directly use: [**ethereum.eth**-link.com](https://ethereum.eth-link.com).

Again, this should work in all Browsers.


Build
-----
Just clone this repository and run
```bash
npm install
```

To build it run
```bash
INFURA_KEY=<your-infura-key> npm run build.  
```

Do not forget to replace <your-infura-key> with your own key.

You will find the result as 'dist/index.html'

Deployment
----------

It is important to deploy this to script to a wildcard subdomain and serve 'dist/index.html' for
all URL paths!

Do not forget to register your domain as "whitelist origin" in infura's project setting.
This hast to be (of course) a wildcard like '\*.example.com'.


Additional information
----------------------

This service makes use of Infura's Ethereum RPC provider 
[https://mainnet.infura.io](https://mainnet.infura.io) as well as Infura's IPFS gateway at
[https://infura-ipfs.io/ipfs/](https://infura-ipfs.io/ipfs/). Both may be set/changed in the source code.


This project makes use of ENS contenthash name resolution [EIP-1577](https://eips.ethereum.org/EIPS/eip-1577).

 
Public repository
-----------------

[https://github.com/berlincode/ens-redirect](https://github.com/berlincode/ens-redirect)

Copyright and license
---------------------

Code and documentation copyright Ulf Bartel. Code is licensed under the
[MIT license](./LICENSE).


