<?php

class Minion_Result
{
    const SUCCESS = true;

    const FAILURE = false;

    const TASK_ABORTED_CLEANLY = 'abort';

    private $_value;

    private $_details;

    private $_exception;

    private $_task;

    private $_db;

    public function __construct(MongoDB $db, $value, $details = null)
    {
        $this->setValue($value);

        $this->_details = $details;

        $this->_db = $db;
    }

    public static function factory(MongoDB $db, $value, $message = null)
    {
        if ($value instanceof Minion_Result) {
            return $value;
        }

        return new Minion_Result($db, $value, $message);
    }

    public static function failure(MongoDB $db, $message = null)
    {
        return new Minion_Result($db, Minion_Result::FAILURE, $message);
    }

    public static function success(MongoDB $db, $message = null)
    {
        return new Minion_Result($db, Minion_Result::SUCCESS, $message);
    }

    public function isSuccess()
    {
        return self::SUCCESS === $this->_value;
    }

    public function isFailure()
    {
        return self::FAILURE === $this->_value;
    }

    public function setValue($value)
    {
        if (self::SUCCESS !== $value && self::FAILURE !== $value) {
            throw new Minion_Result_Exception('Unexpected result provided');
        }

        $this->_value = $value;

        return $this;
    }

    public function getValue()
    {
        return $this->_value;
    }

    public function setDetails($details)
    {
        $this->_details = $details;
        return $this;
    }

    public function setTask(Minion_Task_Abstract $task)
    {
        $this->_task = $task;

        return $this;
    }

    public function getTask()
    {
        return $this->_task;
    }

    public function getDetails()
    {
        return $this->_details;
    }

    public function log()
    {
        $parent = $this->_task->getParent();
        
        $executionTime = date('Y-m-d G:i:s');

        $parent->setStatus(
            $this->_task, 
            $this->_value ? 'success' : 'failure',
            $executionTime
        );

        if ($parent instanceof Minion_Server) {
            $parent = array(
                'server' => $parent->getName()
            );
        } else {
            $parent = array(
                'server' => $parent->getServer()->getName(),
                'domain' => $parent->getName()
            );
        }

        $data = array(
            'task'          => $this->_task->getName(),
            'parent'        => $parent,
            'success'       => (int) $this->_value,
            'executionTime' => $executionTime,
            'details'       => $this->_details
        );

        $this->_db->log->insert($data);
    }

    public function setException(Exception $exception)
    {
        $this->_exception = $exception;
    }
}
