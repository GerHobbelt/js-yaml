JS-YAML - YAML 1.2 parser / writer for JavaScript
=================================================
# fixed 
### dump
``` none
!!null
  "blank"       -> '' +++++
  "canonical"   -> "~"
  "lowercase"   => "null"
  "uppercase"   -> "NULL"
  "camelcase"   -> "Null"
