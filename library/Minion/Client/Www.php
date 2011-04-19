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
 * A client for the Web frontend to Minion.  Provides a couple of simple
 * convenience methods for view and layout rendering.
 */
class Minion_Client_Www extends Minion_Client_Abstract
{
    /**
     * The view associated with the current request.
     *
     * @var Zend_View
     */
    protected $_view;

    protected $_messageSession;

    protected $_user;

    public function init()
    {
        $this->_messageSession = new Zend_Session_Namespace('messages');

        if (! isset($this->_messageSession->messages)) {
            $this->_messageSession->messages = array();
        }
    }
   
    /**
     * Retrieve a view object for this request.
     * 
     * @return Zend_View
     */
    public function getView()
    {
        if (! $this->_view) {
            $this->_view = new Zend_View(array(
                'scriptPath' => getcwd()
            ));

            $this->_view->addHelperPath(
                'Minion/View/Helper', 
                'Minion_View_Helper_'
            );
        }
        
        return $this->_view;
    }

    /**
     * Display the page's layout, using the provided view script for the 
     * rendering of the actual view, and layout.phtml as the layout file.
     *
     * @param string $viewScript
     */
    public function renderLayout($viewScript, $layoutFile = 'default')
    {
        $layout = new Zend_Layout();

        $cursor   = $this->getDb()->settings->find();
        $settings = array();

        foreach ($cursor as $doc) {
            $settings[$doc['setting-name']] = $doc['setting-value'];
        }

        $this->getView()->assign('mobile', $this->isMobile())
                        ->assign('messages', $this->getMessages())
                        ->assign('settings', $settings)
                        ->assign('client', $this)
                        ->assign('user', $this->_user);

        $layout->content = $this->getView()->render($viewScript);

        $layout->setView($this->getView())
               ->setLayoutPath(getcwd() . '/layouts')
               ->setLayout($layoutFile);

        echo $layout->render();
    }

    public function isMobile()
    {
        return false;
    }

    public function addMessage($message, $class = null)
    {
        $this->_messageSession->messages[] = array(
            'message' => $message,
            'class'   => $class
        );

        return $this;
    }

    public function getMessages()
    {
        return $this->_messageSession->messages;
    }

    public function clearMessages()
    {
        unset($this->_messageSession->messages);

        return $this;
    }

    /**
     * Look for config file in the directory about www/.
     *
     * @todo Adjust this so that the config's location is specified in
     *       www/ somehow.
     *
     * @return string The path to the configuration file.
     */
    protected function _detectConfig()
    {
        return dirname(getcwd()) . '/config.xml';
    }

    protected function _handleException(Exception $e)
    {
        $this->getView()->message = $e->getMessage();
        $this->renderLayout('error.phtml');
        exit;
    }
}
