<?php

class Minion_Source_ServerDash extends Minion_Source_Abstract
{
    protected function _getDomainsInternal()
    {
        $url    = 'http://' . $this->getServer()->getHostname();
        $client = new Zend_XmlRpc_Client($url);
        $vhosts = $client->call('vhosts.main');

        foreach ($vhosts as $vhost) {
            $domain = $this->_addDomain($vhost);
        }
    }
}
