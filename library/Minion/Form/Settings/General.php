<?php

class Minion_Form_Settings_General extends Minion_Form_Abstract
{
    private $_data = array();

    public function init()
    {
        foreach ($this->getClient()->getDb()->settings->find() as $doc) {
            $key   = $doc['setting-name'];
            $value = $doc['setting-value'];

            $this->_data[$key] = $value;
        }
    }

    public function getValue($id)
    {
        return $this->getRequest()->getPost($id, $this->_data[$id]);
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
                    array(
                        'helper' => 'formText',
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
                    array(
                        'helper'  => 'formText',
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
                    array(
                        'helper'  => 'formText',
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
                    array(
                        'helper'  => 'formText',
                        'attribs' => array(
                            'class' => 'minion-input-small'
                        ),
                        'validators' => array(
                            'Zend_Validate_NotEmpty' => array(),
                            'Zend_Validate_Float'    => array()
                        )
                    ),
                    array(
                        'helper'  => 'formSelect',
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

    public function save()
    {
        foreach ($this->getElementDefinition() as $element) {
            foreach ($element['inputs'] as $input) {
                $id = $element['id'];

                if (isset($input['id'])) {
                    $id = $input['id'];
                }

                $value = $this->getRequest()->getPost($id);

                $this->getClient()->getDb()->settings->update(
                    array('setting-name' => $id),
                    array('$set' => array('setting-value' => $value)),
                    array('upsert' => true)
                );
            }
        }
    }
}
