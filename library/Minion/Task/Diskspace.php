<?php

class Minion_Task_Diskspace extends Minion_Task_Abstract_Server
{
    public function main()
    {
        $connection = $this->_getSshConnection();
        
        $stream = ssh2_exec(
            $connection,
            'df / | tail -1 | awk \'{print $4}\'',
            false
        );

        stream_set_blocking($stream, true);
        $output = trim(stream_get_contents($stream));

        $freeGigabytes = ($output / 1024 / 1024);
        
        return $freeGigabytes > $this->getConfig()->minimumGigabytes;
    }

    protected function _getSshConnection()
    {
        $port = 22;

        if (isset($this->getConfig()->port)) {
            $port = $this->getConfig()->port;
        }

        $connection = ssh2_connect(
            $this->getParent()->getIp(),
            $port
        );

        if (! $connection) {
            throw new Minion_Task_Exception('Could not connect via SSH');
        }

        $this->_authenticate($connection);

        return $connection;
    }

    protected function _authenticate($conn)
    {
        $config = $this->getConfig();

        $user = $config->username;

        if (isset($config->publicKeyFile) && isset($config->privateKeyFile)) {
            $public  = $config->publicKeyFile;
            $private = $config->privateKeyFile;

            if (! ssh2_auth_pubkey_file($conn, $user, $public, $private)) {
                throw new Minion_Task_Exception(
                    'Could not authenticate with public key over SSH'
                );
            }
        } else {
            $password = $config->password;

            if (! ssh2_auth_password($conn, $user, $password)) {
                throw new Minion_Task_Exception(
                    'Could not authenticate with username and password over SSH'
                );
            }
        } 
    }
}
