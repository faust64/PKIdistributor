PKImgr - a NodeJS&express.js based service, distributing certificates and keys
==============================================================================

Assuming your DNS databases are properly configured, your local hosts should have their own PTR record.
PKImgr allows you to install both certiicates and keys to your servers by downloading them directly from your PKI server. Any host may query for the files corresponding to its PTR record, and nothing else.

I've been using it with puppet. Integration with ansible could be done with `get_url` plugin. It could be usefull in any configuration deployment solution, or scripts you could use installing a new host.

Content
-------
 - `app.js` goes pretty much anywhere. Should be run as a service.
 - `package.json` should be in the same directory as `app.js`, prior to running `npm install`

Installation Instructions
-------------------------

For detailed installation instructions, check out [https://gitlab.unetresgrossebite.com/DevOps/puppet/tree/master/modules/pki/](my PKI puppet module)

Obviously
---------
This service shouldn't be exposed as is.
Keep it behind any SSL (and proxy) capable web server.
