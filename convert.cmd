@ECHO OFF

IF [%1] == [] (
echo Syntax: convert
echo        --input "file.name.cob" - input COBOL copybook
echo        --outprefix "C:\home\output" - output file prefix
echo        --v4 - output V4 format js object, this is the default
echo        --v3 - output v3 format js object
echo        --v2 - output v2 format js object
echo        --v1 - output v1 format js object
echo        --js - create JavaScript friendly field names
echo        --cob - use existing COBOL field names, this is the default
echo        --v2Compatibility - generate backward compatible V2 constructor
echo --
echo Example:
echo    Creates V4 js object with COBOL field names
echo        convert --input "salary.cob" --outprefix "C:\temp\salary"
echo    Creates V4 and V3 js objects with both js and COBOL field names
echo        convert --input "salary.cob" --outprefix "C:\temp\salary" --v4 --v3 --js --cob
) else (
    node src/cli/convert.js %*
)