<?php

abstract class Minion_Notification_Abstract
{
    /**
     * Configuration for the Twitter notifications.  Includes username, 
     * password, and an array of account to direct message.
     *
     * @var Zend_Config
     */
    private $_config;

    /**
     * Constructor
     *
     * @param Zend_Config $config The configuration for these notifications
     */
    public function __construct(Zend_Config $config)
    {
        $this->_config = $config;
    }

    /**
     * Retrieve notification config.
     *
     * @return Zend_Config
     */
    public function getConfig()
    {
        return $this->_config;
    }

    abstract public function send(Minion_Message $message);
}
