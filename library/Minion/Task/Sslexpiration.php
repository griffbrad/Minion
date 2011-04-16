<?php

class Minion_Task_Sslexpiration extends Minion_Task_Abstract_Domain
{
    const ONE_MONTH = 2592000;

    public function shouldRun()
    {
        return parent::shouldRun() 
            && $this->getParent()->getHasSsl();
    }

    public function main()
    {
        $cmd = sprintf(
            'echo "" | openssl s_client -connect %s:443 2> /dev/null '
          . '| openssl x509 -enddate -noout 2> /dev/null',
            $this->getParent()->getName()
        );

        $exitStatus = 0;
        $output     = array();

        exec($cmd, $output, $exitStatus);

        if ($exitStatus) {
            throw new Minion_Task_Exception(
                'Failed to retrieve SSL certificate'
            );
        }

        $expiration = null;

        foreach ($output as $line) {
            if (0 === strpos($line, 'notAfter')) {
                $expiration = strtotime(
                    substr($line, strpos($line, '=') + 1)
                );
                break;
            }
        }

        if (null === $expiration) {
            throw new Minion_Task_Exception(
                'Could not find expiration date for certificate'
            );
        }

        $dateFormatted = date('M j, Y', $expiration);
        $suffix        = ($expiration > time()) ? 'd' : 's';
        $this->getResult()->setDetails(
            "{$this->getParent()->getName()} expire{$suffix} on {$dateFormatted}"
        );

        return $expiration > (time() + self::ONE_MONTH);
    }
}
