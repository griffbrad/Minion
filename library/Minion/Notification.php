<?php

/**
 * Copyright (c) 2009, Brad Griffith <griffbrad@gmail.com>
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without 
 * modification, are permitted provided that the following conditions are met:
 * 
 * - Redistributions of source code must retain the above copyright notice, 
 *   this list of conditions and the following disclaimer.
 * - Redistributions in binary form must reproduce the above copyright notice, 
 *   this list of conditions and the following disclaimer in the documentation 
 *   and/or other materials provided with the distribution.
 * - Neither the name of Brad Griffith nor the names of other contributors may 
 *   be used to endorse or promote products derived from this software without
 *   specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE 
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN 
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF 
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * A collection of static methods for managing notifications.
 */
class Minion_Notification
{
    /**
     * The global notification configuration.
     *
     * @var Zend_Config
     */
    static private $_config;

    /**
     * The queue of messages to be sent.
     *
     * @var array
     */
    static private $_queue = array();
    
    /**
     * Prevent instantiation of this class.
     */
    private function __construct()
    {

    }

    /**
     * Set the global configuration options for notifications.  These options
     * will serve as a fallback in case there is a system failure prior to
     * reaching servers, domains, tasks, etc.
     *
     * @param Zend_Config $config
     */
    public static function setGlobalConfig(Zend_Config $config)
    {
        self::$_config = new Zend_Config($config->toArray(), true);
    }

    public static function getGlobalConfig()
    {
        return self::$_config;
    }

    /**
     * Queue a message for sending.  Messages are queue and aggregated to
     * flooding a recipient with numerous messages in a short period of time.
     * The queue also serves as a mechanism to prevent messages from never being
     * sent.  For example, in the case of network failure, messages will remain
     * in the queue and be sent once connectivity is restored.
     *
     * @param Minion_Message $message The message to queue.
     * @param Zend_Config $config Addition notification configuration for the
     *                            message.
     */
    public static function queue(Minion_Message $message, Zend_Config $config)
    {
        foreach ($notifications as $key => $notification) {
            $obj = self::factory($key, $notification);
            $obj->send($message);
        }
    }

    /** 
     * Create a notification object based on the name from the configuration.
     * For example, "twitter" would create a Minion_Notification_Twitter object.
     *
     * @param string $key The name of the notification type.
     * @param Zend_Config $config
     *
     * @return Minion_Notification_Abstract
     */
    public static function factory($key, Zend_Config $config)
    {
        $className = 'Minion_Notification_' . ucfirst($key);
        return new $className($config);
    }
}
