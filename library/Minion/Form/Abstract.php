<?php

abstract class Minion_Form_Abstract
{
    private $_request;

    private $_view;

    private $_messages = array();

    public function __construct(Zend_Controller_Request_Http $request,
        Minion_Client_Www $client)
    {
        $this->_request = $request;
        $this->_client  = $client;
        $this->_view    = $client->getView();

        $this->_view->formHandler($this);

        $this->init();
    }

    public function getValue($id)
    {
        return $this->getRequest()->getPost($id);
    }

    abstract public function getElementDefinition();

    abstract public function save();

    public function init()
    {

    } 
    
    public function display()
    {
        foreach ($this->getElementDefinition() as $element) {
            if (isset($element['divider'])) {
                echo '<h2>';                
                echo $this->getView()->escape($element['divider']);

                if (isset($element['optional']) && $element['optional']) {
                    echo '<span>Optional</span>';
                }

                echo '</h2>';
                continue;
            }

            $this->_view->formField(array(
                'for'   => $element['id'],
                'label' => $element['label']
            ));

            if (isset($element['note'])) {
                $this->_view->formField()->setNote($element['note']);
            }
            
            if (isset($element['help'])) {
                $this->_view->formField()->setHelp($element['help']);
            }
            
            if (isset($element['warn'])) {
                $this->_view->formField()->setWarn($element['warn']);
            }

            $this->_view->formField()->open();

            foreach ($element['inputs'] as $input) {
                $helper = $input['helper'];
                $id     = $element['id'];
            
                if (isset($input['id'])) {
                    $id = $input['id'];
                }

                echo $this->_view->$helper(
                    $id,
                    $this->getValue($id),
                    (isset($input['attribs']) ? $input['attribs'] : null),
                    (isset($input['options']) ? $input['options'] : null)
                );
            }

            $this->_view->formField()->close();
        }
    }

    public function getView()
    {
        return $this->_view;
    }

    public function getClient()
    {
        return $this->_client;
    }

    public function getRequest()
    {
        return $this->_request;
    }

    public function isValid()
    {
        if (! $this->_request->isPost()) {
            return false;
        }

        $valid = true;

        foreach ($this->getElementDefinition() as $element) {
            if (isset($element['divider'])) {
                continue;
            }

            $messages = array();

            foreach ($element['inputs'] as $input) {
                $chain = new Zend_Validate();

                if (isset($input['validators']) && is_array($input['validators'])) {
                    foreach ($input['validators'] as $class => $options) {
                        $validator = new $class($options);
                        $chain->addValidator($validator);
                    }
                }

                $id = $element['id'];

                if (isset($input['id'])) {
                    $id = $input['id'];
                }

                $value = $this->_request->getPost($id);

                if (! $chain->isValid($value)) {
                    $valid = false; 

                    foreach ($chain->getMessages() as $message) {
                        $messages[] = $message;
                    }
                }
            }

            $id = $element['id'];
            $this->_messages[$id] = $messages;
        }

        if (! $valid) {
            $this->_client->addMessage(
                'Please correct the highlighted mistakes and try again',
                'minion-message-error'
            );
        }

        return $valid;
    }

    public function getMessages($id)
    {
        if (isset($this->_messages[$id])) {
            return $this->_messages[$id];
        }

        return array();
    }

}
