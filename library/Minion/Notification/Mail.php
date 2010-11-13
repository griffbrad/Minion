<?php

class Minion_Notification_Mail extends Minion_Notification_Abstract
{
    public function send(Minion_Message $message)
    {
        $transport = $this->_getTransport();

        $mail = new Zend_Mail();
        $mail->setBodyText($message->getFull());
        $mail->setSubject($message->getSummary());
        
        $mail->setFrom(
            $this->getConfig()->from->address,
            $this->getConfig()->from->name
        );

        foreach ($this->getConfig()->recipients as $recipient) {
            if (Minion_Config::isEnabled($recipient)) {
                $mail->addTo($recipient->address, $recipient->name);
            }
        }

        $mail->send($transport);
    }

    protected function _getTransport()
    {
        $config = $this->getConfig();

        if (! $config->transport || 'sendmail' === $config->transport->type) {
            $transport = new Zend_Mail_Transport_Sendmail(
                $config->options
            );
        } elseif ('smtp' === $config->transport->type) {
            $transport = new Zend_Mail_Transport_Smtp(
                $config->transport->server, 
                $config->transport->options->toArray()
            );
        } else {
            throw new Minion_Notification_Exception(
                "Unknown mail transport '{$config->transport->type}' specified"
            );
        }

        return $transport;
    }
}
