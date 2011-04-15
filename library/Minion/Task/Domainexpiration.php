<?php

require_once 'Net/Whois.php';

class Minion_Task_Domainexpiration extends Minion_Task_Abstract_Domain
{
    const ONE_MONTH = 2592000;

    public function main()
    {
        $server = $this->_getWhoisServer();
        $domain = $this->_getWhoisDomain();
        $whois  = new Net_Whois();

        $data = $whois->query($domain, $server);

        if (PEAR::isError($data)) {
            throw new Minion_Task_Exception($data->getMessage());
        }

        $lines      = explode(PHP_EOL, $data);
        $expiration = null;

        $patterns = array(
            '/^\s*expiration date:\s*([a-z0-9\-]+)\s*([0-9]{2}:[0-9]{2}:[0-9]{2} [A-Z]{3})?\s*$/i',

            //Domain Expiration Date:                      Wed Apr 17 23:59:59 GMT 2013
            '/^Domain Expiration Date:\s*[a-z]+ ([a-z]{3} [0-9]+ [0-9]{2}:[0-9]{2}:[0-9]{2} [A-Z]{3} [0-9]{4})\s*$/i'
        );

        foreach ($lines as $line) {
            $matches = array();

            foreach ($patterns as $pattern) {
                if (preg_match($pattern, $line, $matches)) {
                    $expiration = $this->_normalizeDate($matches[1]);
                    break 2;
                }
            }
        }

        if (! $expiration) {
            foreach ($lines as $line) {
                echo $line . PHP_EOL;
            }

            exit;
        }

        if (! $expiration) {
            throw new Minion_Task_Exception('Could not find expiration date');
        }

        $dateFormatted = date('M j, Y', $expiration);
        $this->getResult()->setDetails("{$domain} expires on {$dateFormatted}");

        // Have to avoid whois limits.  Lame.
        sleep(15);

        return $expiration > (time() + self::ONE_MONTH);    
    }

    protected function _getWhoisServer()
    {
        preg_match(
            '/\.([a-z]+)$/i', 
            $this->getParent()->getName(), 
            $matches
        );

        $tld = $matches[1];

        return $tld . '.whois-servers.net';
    }

    protected function _getWhoisDomain()
    {
        preg_match(
            '/\.?([a-z\-0-9]+\.[a-z\-0-9]+)$/i',
            $this->getParent()->getName(),
            $matches
        );

        return $matches[1];
    }

    protected function _normalizeDate($date)
    {
        return strtotime($date);
    }
}
