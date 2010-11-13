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
 * A basic message class useful for domain-oriented task.  Similar classes are
 * needed for server-oriented tasks.  We also need a method to retrieve a
 * detailed message in addition to the summary.
 */
class Minion_Message
{
    /**
     * Domain the message is about.
     *
     * @var string
     */
    protected $_domain;

    /**
     * The server the message is about.
     *
     * @var string
     */
    protected $_server;
   
    /**
     * The task the message is about.
     * 
     * @var string
     */
    protected $_task;

    /**
     * The result of the task.
     *
     * @var boolean
     */
    protected $_success;

    /**
     * Constructor.  Set needed class properties.
     */
    public function __construct(Minion_Result $result)
    {
        $this->_success = $result->getValue();
        $this->_message = $result->getDetails();

        $task = $result->getTask();

        $this->_task = $task->getName();

        if ($task instanceof Minion_Task_Abstract_Server) {
            $this->_domain = null;
            $this->_server = $task->getParent()->getName();
        } else {
            $this->_domain = $task->getParent()->getName();
            $this->_server = $task->getParent()->getServer()->getName();
        }
    }

    /**
     * Get a short version of the message.  Useful in certain contexts where
     * message length is constrained (e.g. Twitter, text messages, etc.).
     *
     * @param integer $maxLength The maximum length allowed for the summary.
     *
     * @return string
     */
    public function getSummary($maxLength = null)
    {
        if ($this->_domain) {
            $summary = sprintf(
                '%s %s on %s (%s)',
                $this->_success ? 'RECOVERED' : 'FAILURE',
                $this->_domain,
                $this->_server,
                $this->_task
            );
        } else {
            $summary = sprintf(
                '%s %s (%s)',
                $this->_success ? 'RECOVERED' : 'FAILURE',
                $this->_server,
                $this->_task
            );
        }

        if (null !== $maxLength) {
            $summary = substr($summary, 0, $maxLength);
        }

        return $summary;
    }

    public function getFull()
    {
        return $this->getSummary() 
             . PHP_EOL . PHP_EOL 
             . $this->_message;
    }
}
