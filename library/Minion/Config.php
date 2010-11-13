<?php

class Minion_Config
{
    public static function isConfig($config)
    {
        return $config instanceof Zend_Config;
    }

    public static function isEnabled($config)
    {
        if (! $config instanceof Zend_Config) {
            return false;
        }

        if ((isset($config->enabled) && $config->enabled)
            || (isset($config->disabled) && ! $config->disabled)
            || (! isset($config->disabled) && ! isset($config->enabled))) {

            return true;
        }

        return false;
    }

    public static function merge($base, $extend = null)
    {
        $config = new Zend_Config(array(), true);

        if ($base instanceof Zend_Config) {
            $config = $config->merge($base);
        }

        if ($extend instanceof Zend_Config) {
            $config = $config->merge($extend);
        }

        return $config;
    }

    public static function isEquivalent($original, $compare)
    {
        if (! self::isConfig($original) || ! self::isConfig($compare)) {
            return false;
        }

        $original = self::_sortRecursive($original->toArray());
        $compare  = self::_sortRecursive($compare->toArray());

        return $original === $compare;
    }

    private static function _sortRecursive(array $data)
    {
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = self::_sortRecursive($value);
            }
        }

        ksort($data);

        return $data;
    }
}
