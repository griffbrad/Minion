<?php

class Minion_Form_Settings_UserEdit extends Minion_Form_Abstract
{
    public function getElementDefinition()
    {
        $imNetworks = array(
            null,
            'AOL'    => 'AOL',
            'Google' => 'Google',
            'ICQ'    => 'ICQ',
            'Jabber' => 'Jabber',
            'MSN'    => 'MSN',
            'Skype'  => 'Skype',
            'Yahoo'  => 'Yahoo'
        );
        return array(
            array(
                'id'     => 'first-name',
                'label'  => 'First name',
                'inputs' => array(
                    array(
                        'helper' => 'formText',
                        'validators' => array(
                            'Zend_Validate_NotEmpty' => array(),
                            'Zend_Validate_StringLength' => array(
                                'max' => 32
                            )
                        ),
                        'attribs' => array(
                            'class' => 'minion-input-medium'
                        )
                    )
                )
            ),
            array(
                'id'     => 'last-name',
                'label'  => 'Last name',
                'inputs' => array(
                    array(
                        'helper' => 'formText',
                        'validators' => array(
                            'Zend_Validate_NotEmpty' => array(),
                            'Zend_Validate_StringLength' => array(
                                'max' => 32
                            )
                        ),
                        'attribs' => array(
                            'class' => 'minion-input-medium'
                        )
                    )
                )
            ),
            array(
                'id'     => 'email-address',
                'label'  => 'Email address',
                'inputs' => array(
                    array(
                        'helper' => 'formText',
                        'validators' => array(
                            'Zend_Validate_NotEmpty' => array(),
                            'Zend_Validate_StringLength' => array(
                                'max' => 128
                            ),
                            'Zend_Validate_EmailAddress' => array()
                        )
                    )
                )
            ),
            array(
                'divider' => 'Contact Information',
                'optional' => true
            ),
            array(
                'id'     => 'company',
                'label'  => 'Company',
                'inputs' => array(
                    array(
                        'helper' => 'formText',
                        'validators' => array(
                            'Zend_Validate_StringLength' => array(
                                'max' => 64
                            )
                        )
                    )
                )
            ),
            array(
                'id'     => 'title',
                'label'  => 'Title',
                'inputs' => array(
                    array(
                        'helper' => 'formText',
                        'validators' => array(
                            'Zend_Validate_StringLength' => array(
                                'max' => 64
                            )
                        ),
                        'attribs' => array(
                            'class' => 'minion-input-medium'
                        )
                    )
                )
            ),
            array(
                'id'     => 'office-phone',
                'label'  => 'Office phone',
                'inputs' => array(
                    array(
                        'helper' => 'formText',
                        'validators' => array(
                            'Zend_Validate_StringLength' => array(
                                'max' => 32
                            ),
                            'Zend_Validate_Digits' => array()
                        ),
                        'attribs' => array(
                            'class' => 'minion-input-medium'
                        )
                    ),
                    array(
                        'id' => 'office-phone-ext',
                        'helper' => 'formText',
                        'validators' => array(
                            'Zend_Validate_StringLength' => array(
                                'max' => 6
                            ),
                            'Minion_Validate_Digits' => array()
                        ),
                        'attribs' => array(
                            'class' => 'minion-input-small'
                        )
                    )
                )
            ),
            array(
                'id'     => 'cell-phone',
                'label'  => 'Cell phone',
                'inputs' => array(
                    array(
                        'helper' => 'formText',
                        'validators' => array(
                            'Zend_Validate_StringLength' => array(
                                'max' => 32
                            ),
                            'Minion_Validate_Digits' => array()
                        ),
                        'attribs' => array(
                            'class' => 'minion-input-medium'
                        )
                    )
                )
            ),
            array(
                'id' => 'im-name',
                'label' => 'IM name and network',
                'note'  => 'Provide the preferred instant messaging screen name 
                            and network.',
                'inputs' => array(
                    array(
                        'helper' => 'formText',
                        'validators' => array(
                            'Zend_Validate_StringLength' => array(
                                'max' => 32
                            )
                        ),
                        'attribs' => array(
                            'class' => 'minion-input-medium'
                        )
                    ),
                    array(
                        'id' => 'im-network',
                        'helper' => 'formSelect',
                        'options' => $imNetworks,
                        'validators' => array(
                            'Zend_Validate_InArray' => array(
                                'haystack' => $imNetworks
                            )
                        )
                    )
                )
            ),
            array(
                'divider' => 'Include a personal note with this account 
                              invitation?',
                'optional' => true
            ),
            array(
                'id' => 'note',
                'label' => 'Note',
                'inputs' => array(
                    array(
                        'helper' => 'formTextarea',
                        'attribs' => array(
                            'cols' => 50,
                            'rows' => 8
                        )
                    )
                )
            )
        );
    }

    public function save()
    {

    }
}
