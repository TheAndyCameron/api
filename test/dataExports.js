var assert = require('assert');
var CSVConverter = require('../api/helpers/JSONToCSVCaseConverter.js');

//Tests for CSV converter

describe('CSV Converter Functions', function(){
    
    describe('Prepare Value function.', function(){
        it('Should return string unchanged.', function(){
            var strVal = "Hello this is a test.";
            assert.equal(strVal, CSVConverter.prepareValue(strVal));
        });
        
        it('Should return numerical values as a string version of the value.', function(){
            var intVal = 43;
            assert.equal(String(intVal), CSVConverter.prepareValue(intVal));
        });
        
        it('Should return negative numerical values as a string version of the value.', function(){
            var intVal = -84;
            assert.equal(String(intVal), CSVConverter.prepareValue(intVal));
        });
        
        it('Should return boolean values as a string version of the value.', function(){
            var boolVal = true;
            assert.equal(String(boolVal), CSVConverter.prepareValue(boolVal));
        });
        
        it('Should return empty string for null value.', function(){
            let nullVal;
            assert.equal("", CSVConverter.prepareValue(nullVal));
        });
        
        it('Comma character should be escaped', function(){
            var strWithComma = "Oh no, I dislike tests.";
            var strWithEscapedComma = "\"Oh no, I dislike tests.\"";    //Excel friendly (Assumed best based on use cases?)
            //var strWithEscapedComma = "Oh no\, I dislike tests.";     //Unix friendly
            assert.equal(strWithEscapedComma, CSVConverter.prepareValue(strWithComma));
        });
        
        it('Pipe character should be escaped', function(){
            var strWithPipe = "Look at my pipe | I like it";
            var strWithEscapedPipe = "Look at my pipe \\| I like it";
            assert.equal(strWithEscapedPipe, CSVConverter.prepareValue(strWithPipe));
        });
    });
    
    describe('Format List Tests', function(){
        it('Should give a single string with list elements separated by pipe characters (|)', function(){
            var list = ["ABC","DEF","GHI"];
            var expectedStr = "ABC|DEF|GHI";
            assert.equal(expectedStr, CSVConverter.formatListStructure(list));
        });
        
        it('Should give a single string with numerical list elements separated by pipe characters (|)', function(){
            var list = [42,256,1048576];
            var expectedStr = "42|256|1048576";
            assert.equal(expectedStr, CSVConverter.formatListStructure(list));
        });
        
        it('Should give an empty string for an empty list', function(){
            var list = [];
            var expectedStr = "";
            assert.equal(expectedStr, CSVConverter.formatListStructure(list));
        });
        
        it('Should give an empty string in place of a null value in a list', function(){
            var list = ["First", null, "last"];
            var expectedStr = "First||last";
            assert.equal(expectedStr, CSVConverter.formatListStructure(list));
        });
        
        it('Should escape any pipe characters pre-existing in the list.', function(){
            var list = ["First", "Last|More Last"];
            var expectedStr = "First|Last\\|More Last";
            assert.equal(expectedStr, CSVConverter.formatListStructure(list));
        });
    });
    
    describe('Format Object List Tests', function(){
        //TODO
    });
    
});
