<?php

class Minion_ResultNotifier
{
    protected $_results = array();

    protected $_baseConfig;

    public function __construct(Zend_Config $config)
    {
        $this->_baseConfig = $config;
    }

    public function add($result)
    {
        if (Minion_Result::TASK_ABORTED_CLEANLY === $result) {
            return;
        }

        if (! $result instanceof Minion_Result) {
            throw new Minion_Exception(
                'Invalid result passed to ResultNotifier'
            );
        }

        $this->_results[] = $result;
        return $this;
    }

    public function sendNotifications()
    {
        foreach ($this->_results as $result) {
            $config = Minion_Config::merge(
                $this->_baseConfig,
                $result->getTask()->getConfig()->notifications
            );

            if (! Minion_Config::isEnabled($config)) {
                continue;
            }
            
            if (isset($config->repeatsBeforeNotification)) {
                $repeats = $config->repeatsBeforeNotification;
            } else {
                $repeats = 1;
            }

            if (! $result->getTask()->resultHasChanged($repeats)) {
                continue;
            }

            foreach ($config->methods as $method => $options) {
                $method       = ucfirst($method);
                $className    = "Minion_Notification_{$method}";
                $notification = new $className($options);

                $message = new Minion_Message($result);

                $notification->send($message);
            }
        }
    }
}
