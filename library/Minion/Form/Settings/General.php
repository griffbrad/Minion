<?php

class Minion_Form_Settings_General
{
    private $_request;

    private $_view;

    private $_messages = array();

    private $_data = array();

    public function __construct(Zend_Controller_Request_Http $request,
        Minion_Client_Www $client)
    {
        $this->_request = $request;
        $this->_client  = $client;
        $this->_view    = $client->getView();

        $this->_view->formHandler($this);

        $this->init();
    }

    public function init()
    {
        foreach ($this->_client->getDb()->settings->find() as $doc) {
            $key   = $doc['setting-name'];
            $value = $doc['setting-value'];

            $this->_data[$key] = $value;
        }
    }

    public function getValue($id)
    {
        return $this->_request->getPost($id, $this->_data[$id]);
    }

    public function getElementDefinition()
    {
        return array(
            array(
                'id'     => 'site-name',
                'label'  => 'Your Minion site name',
                'note'   => 'The Minion site name appears at the top of each
                               page and in notifications.',
                'inputs' => array(
                    'formText' => array(
                        'validators' => array(
                            'Zend_Validate_NotEmpty' => array()
                        )
                    )
                )
            ),
            array(
                'id'     => 'desktop-date-format',
                'label'  => 'Desktop date and time format',
                'note'   => 'The desktop date format is used for all dates
                             displayed in desktop web browsers.',
                'help'   => 'minion-help-desktop-date',
                'inputs' => array(
                    'formText' => array(
                        'attribs' => array(
                            'class' => 'minion-input-medium'
                        ),
                        'validators' => array(
                            'Zend_Validate_NotEmpty' => array()
                        )
                    )
                )
            ),
            array(
                'id'     => 'mobile-date-format',
                'label'  => 'Mobile date and time format',
                'note'   => 'The mobile date format will be used for dates 
                             displayed on mobile devices where space is often 
                             more constrained.',
                'help'   => 'minion-help-mobile-date',
                'inputs' => array(
                    'formText' => array(
                        'attribs' => array(
                            'class' => 'minion-input-medium'
                        ),
                        'validators' => array(
                            'Zend_Validate_NotEmpty' => array()
                        )
                    )
                )
            ),
            array(
                'id'     => 'log-size',
                'label'  => 'Log size',
                'note'   => 'The amount of storage space to dedicate to the
                             monitoring log.',
                'warn'   => array(
                    'label' => 'Changing log size will erase existing log entries'
                ),
                'inputs' => array(
                    'formText' => array(
                        'attribs' => array(
                            'class' => 'minion-input-small'
                        ),
                        'validators' => array(
                            'Zend_Validate_NotEmpty' => array(),
                            'Zend_Validate_Float'    => array()
                        )
                    ),
                    'formSelect' => array(
                        'id'      => 'log-size-unit',
                        'options' => array(
                            'm' => 'Megabytes',
                            'g' => 'Gigabytes'
                        ),
                        'validators' => array(
                            'Zend_Validate_NotEmpty' => array(),
                            'Zend_Validate_InArray' => array(
                                'haystack' => array('m', 'g')
                            )
                        )
                    )
                )
            )
        );
    }

    public function display()
    {
        foreach ($this->getElementDefinition() as $element) {
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

            foreach ($element['inputs'] as $helper => $input) {
                $id = $element['id'];
            
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
            $messages = array();

            foreach ($element['inputs'] as $input) {
                $chain = new Zend_Validate();

                foreach ($input['validators'] as $class => $options) {
                    $validator = new $class($options);
                    $chain->addValidator($validator);
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

    public function save(MongoDB $db)
    {
        foreach ($this->getElementDefinition() as $element) {
            foreach ($element['inputs'] as $input) {
                $id = $element['id'];

                if (isset($input['id'])) {
                    $id = $input['id'];
                }

                $value = $this->_request->getPost($id);

                $db->settings->update(
                    array('setting-name' => $id),
                    array('$set' => array('setting-value' => $value)),
                    array('upsert' => true)
                );
            }
        }
    }
}
