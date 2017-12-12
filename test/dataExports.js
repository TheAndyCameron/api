const assert = require('assert');
const CSVConverter = require('../api/helpers/data_converters.js');
const { filterFields } = require('../api/helpers/things.js');

//Tests for CSV converter

describe('CSV Converter Functions', function(){
    
    describe('Prepare Value function.', function(){
        it('Should return string unchanged.', function(){
            var strVal = "Hello this is a test.";
            assert.equal(CSVConverter.prepareValue(strVal), strVal);
        });
        
        it('Should return numerical values as a string version of the value.', function(){
            var intVal = 43;
            assert.equal(CSVConverter.prepareValue(intVal), String(intVal));
        });
        
        it('Should return negative numerical values as a string version of the value.', function(){
            var intVal = -84;
            assert.equal(CSVConverter.prepareValue(intVal), String(intVal));
        });
        
        it('Should return boolean values as a string version of the value.', function(){
            var boolVal = true;
            assert.equal(CSVConverter.prepareValue(boolVal), String(boolVal));
        });
        
        it('Should return empty string for null value.', function(){
            let nullVal;
            assert.equal(CSVConverter.prepareValue(nullVal), "");
        });
        
        it('Comma character should be escaped', function(){
            var strWithComma = "Oh no, I dislike tests.";
            var strWithEscapedComma = "\"Oh no, I dislike tests.\"";    //Excel friendly (Assumed best based on use cases?)
            //var strWithEscapedComma = "Oh no\, I dislike tests.";     //Unix friendly
            assert.equal(CSVConverter.prepareValue(strWithComma), strWithEscapedComma);
        });

	    it('Comma character should be escaped and escape double quotes that should be kept.', function(){
            var strWithComma = '"Oh no, I dislike tests," she said.';
            var strWithEscapedComma = '"""Oh no, I dislike tests,"" she said."';    //Excel friendly (Assumed best based on use cases?)
            assert.equal(CSVConverter.prepareValue(strWithComma), strWithEscapedComma);
        });
        
        it('Pipe character should be escaped', function(){
            var strWithPipe = "Look at my pipe | I like it";
            var strWithEscapedPipe = '"Look at my pipe | I like it"';
            assert.equal(CSVConverter.prepareValue(strWithPipe), strWithEscapedPipe);
        });
    });
    
    describe('Format List Tests', function(){
        it('Should give a single string with list elements separated by pipe characters (|)', function(){
            var list = ["ABC","DEF","GHI"];
            var expectedStr = '"ABC|DEF|GHI"';
            assert.equal(CSVConverter.formatListStructure(list), expectedStr);
        });
        
        it('Should give a single string with numerical list elements separated by pipe characters (|)', function(){
            var list = [42,256,1048576];
            var expectedStr = '"42|256|1048576"';
            assert.equal(CSVConverter.formatListStructure(list), expectedStr);
        });
        
        it('Should give an empty string for an empty list', function(){
            var list = [];
            var expectedStr = "";
            assert.equal(CSVConverter.formatListStructure(list), expectedStr);
        });
        
        it('Should give an empty string in place of a null value in a list', function(){
            var list = ["First", null, "last"];
            var expectedStr = '"First||last"';
            assert.equal(CSVConverter.formatListStructure(list), expectedStr);
        });
        
        it('Should escape any pipe characters pre-existing in the list.', function(){
            var list = ["First", "Last|More Last"];
            var expectedStr = '"First|""Last|More Last"""';
            assert.equal(CSVConverter.formatListStructure(list), expectedStr);
        });
    });
    
    describe('Format Object List Tests', function(){
        it('Should separate fields into individual consecutive lists.', function(){
            var objList = [{a:"Hello", b:"There", c:"You!"}, {a:"Goodbye", b:"There", c:"Jim"}];
            var expectedStr = '"Hello|Goodbye","There|There","You!|Jim"';
            assert.equal(CSVConverter.formatObjectList(objList), expectedStr);
        });

        it('Should work with numerical values.', function(){
            var objList = [{a:1, b:2, c:3}, {a:4, b:5, c:6}];
            var expectedStr = '"1|4","2|5","3|6"';
            assert.equal(CSVConverter.formatObjectList(objList), expectedStr);
        });

        it('Should work with null values', function(){
            var objList = [{a:null, b:null, c:null}, {a:null, b:null, c:null}];
            var expectedStr = '"|","|","|"';
            assert.equal(CSVConverter.formatObjectList(objList), expectedStr);
        });

        it('Should work with a mix of types', function(){
            var objList = [{a:"Hello", b:3, c:true}, {a:null, b:-42, c:false}];
            var expectedStr = '"Hello|","3|-42","true|false"';
            assert.equal(CSVConverter.formatObjectList(objList), expectedStr);
        });

        it('Should escape any comma characters, without affecting surrounding columns', function(){
            var objList = [{a:"Hello", b:3, c:"Words"}, {a:"Goodbye", b:-42, c:"and, More Words"}];
            var expectedStr = '"Hello|Goodbye","3|-42","Words|""and, More Words"""';
            assert.equal(CSVConverter.formatObjectList(objList), expectedStr);
        });

        it('Should escape Pipe charcters', function(){
            var objList = [{a:"Hello|Greetings", b:3, c:true}, {a:"Goodbye|Cya later", b:-42, c:false}];
            var expectedStr = '"""Hello|Greetings""|""Goodbye|Cya later""","3|-42","true|false"';
            assert.equal(CSVConverter.formatObjectList(objList), expectedStr);
        });

        it('Should escape a combination of commas and pipe characters', function(){
            var objList = [{a:"Hello", b:"A, B, and C", c:"Apples|Oranges"}, {a:"Goodbye|Cya", b:"DEF", c:"Melons, and Bananas"}];
            var expectedStr = '"Hello|""Goodbye|Cya""","""A, B, and C""|DEF","""Apples|Oranges""|""Melons, and Bananas"""';
            assert.equal(CSVConverter.formatObjectList(objList), expectedStr);
        });
    });
    
    describe('Format full thing',function(){
        const obj = {
            "foo":"single Value",
            "bar":["list ele 1", "list ele 2", "list ele 3"],
            "bat":{
                "bat1":"Value inside object 1",
                "bat2":"Value inside object 2"
            },
            "baz":[
            {
                "baz1":"list obj 1 ele 1",
                "baz2":"list obj 1 ele 2"
            },
            {
                "baz1":"list obj 2 ele 1",
                "baz2":"list obj 2 ele 2"
            }
            ]
        }
    
        const objWithBadCharacters = {
            "foo":"single Value",
            "bar":["list, ele 1", "list ele 2", "list| ele 3"],
            "bat":{
                "bat1":"Value inside, object 1",
                "bat2":"Value| inside object 2"
            },
            "baz":[
            {
                "baz1":"list obj 1, ele 1",
                "baz2":"list obj 1| ele 2"
            },
            {
                "baz1":"list obj 2; ele 1",
                "baz2":"list obj 2, ele 2"
            }
            ],
            "nullVal":null,
            "emptyList":[]
        }
    
        const objWithEmptyAuthors = {
            "foo":"single Value",
            "bar":["list ele 1", "list ele 2", "list ele 3"],
            "bat":{
                "bat1":"Value inside object 1",
                "bat2":"Value inside object 2"
            },
            "baz":[
            {
                "baz1":"list obj 1 ele 1",
                "baz2":"list obj 1 ele 2"
            },
            {
                "baz1":"list obj 2 ele 1",
                "baz2":"list obj 2 ele 2"
            }
            ],
            "authors":[]
        }
    
        it('Generate Headers', function(){
            var headers = CSVConverter.findColumnHeadingsForStructure(obj);
            var expected = 'foo,bar_list,bat_bat1,bat_bat2,baz_baz1_list,baz_baz2_list';
            assert.equal(headers, expected);
        });
    
        it('Generate Headers with null value fields', function(){
            var headers = CSVConverter.findColumnHeadingsForStructure(objWithBadCharacters);
            var expected = 'foo,bar_list,bat_bat1,bat_bat2,baz_baz1_list,baz_baz2_list,nullVal,emptyList_list';
            assert.equal(headers, expected);
        });
        
        it('Generate Headers with author list column headers', function(){
            var headers = CSVConverter.findColumnHeadingsForStructure(objWithEmptyAuthors);
            var expected = 'foo,bar_list,bat_bat1,bat_bat2,baz_baz1_list,baz_baz2_list,authors_user_id_list,authors_timestamp_list,authors_name_list';
            assert.equal(headers, expected);
        });
    
        it('Generate row in file', function(){
            var dataRow = CSVConverter.formatGenericStructure(obj);
            var expected = 'single Value,"list ele 1|list ele 2|list ele 3",Value inside object 1,Value inside object 2,"list obj 1 ele 1|list obj 2 ele 1","list obj 1 ele 2|list obj 2 ele 2"';
            assert.equal(dataRow, expected);
        });
        
        it('Generate row in file with escaped characters', function(){
            var dataRow = CSVConverter.formatGenericStructure(objWithBadCharacters);
            var expected = 'single Value,"""list, ele 1""|list ele 2|""list| ele 3""","Value inside, object 1","Value| inside object 2","""list obj 1, ele 1""|""list obj 2; ele 1""","""list obj 1| ele 2""|""list obj 2, ele 2""",,';
            assert.equal(dataRow, expected);
        });
        
        it('Generate row in file adding in columns for empty author list', function(){
            var dataRow = CSVConverter.formatGenericStructure(objWithEmptyAuthors);
            var expected = 'single Value,"list ele 1|list ele 2|list ele 3",Value inside object 1,Value inside object 2,"list obj 1 ele 1|list obj 2 ele 1","list obj 1 ele 2|list obj 2 ele 2",,,';
            assert.equal(dataRow, expected);
        });
    });
});


describe('Filtering function tests:', function(){
    
    describe('Expected Operation', function(){

        describe('on flat structure', function(){
            it('with single filter', function(){
                obj = { a:"A", b:"B", c:"C", d:"D"};
                filter = { b:null };
                
                expectedObj = { a:"A", c:"C", d:"D" };
                assert.equal(JSON.stringify(filterFields(obj, filter)), JSON.stringify(expectedObj));
            }); 
            
            it('with multiple filter', function(){
                obj = { a:"A", b:"B", c:"C", d:"D" };
                filter = { b:null, d:null };
                
                expectedObj = { a:"A", c:"C" };
                assert.equal(JSON.stringify(filterFields(obj, filter)), JSON.stringify(expectedObj));
            });
        });
        
        describe('on fields in an object', function(){
            it('with single filter', function(){
                obj = { a:"A", b:{ c:"C", d:"D" } };
                filter = { b:{d:null} };
                
                expectedObj = { a:"A", b:{ c:"C" } };
                assert.equal(JSON.stringify(filterFields(obj, filter)), JSON.stringify(expectedObj));
            });

            it('with multiple filter', function(){
                obj = { a:"A", b:{ c:"C", d:"D", e:"E" } };
                filter = { b:{ c:"C", d:"D" } };
                
                expectedObj = { a:"A", b:{ e:"E" } };
                assert.equal(JSON.stringify(filterFields(obj, filter)), JSON.stringify(expectedObj));
            });

            it('with removing the object', function(){
                obj = { a:"A", b:{ c:"C", d:"D" } };
                filter = { b:null };
                
                expectedObj = { a:"A" };
                assert.equal(JSON.stringify(filterFields(obj, filter)), JSON.stringify(expectedObj));
            });
        });

        describe('on list fields', function(){
            it('with single filter', function(){
                obj = { a:"A", b:["B", "BE", "BEE"] };
                filter = { b:null };
                
                expectedObj = { a:"A" };
                assert.equal(JSON.stringify(filterFields(obj, filter)), JSON.stringify(expectedObj));
            });
        });

        describe('on fields in an object list', function(){
            it('with single filter', function(){
                obj = { a:"A", b:[{ c:"C", d:"D" }, { c:"C", d:"D" }] };
                filter = { b:{d:null} };
                
                expectedObj = { a:"A", b:[{ c:"C" }, { c:"C" }] };
                assert.equal(JSON.stringify(filterFields(obj, filter)), JSON.stringify(expectedObj));
            });

            it('with multiple filter', function(){
                obj = { a:"A", b:[{ c:"C", d:"D", e:"E" }, { c:"C", d:"D", e:"E" }] };
                filter = { b:{ c:"C", d:"D" } };
                
                expectedObj = { a:"A", b:[{ e:"E" }, { e:"E" }] };
                assert.equal(JSON.stringify(filterFields(obj, filter)), JSON.stringify(expectedObj));
            });

            it('with removing the list', function(){
                obj = { a:"A", b:[{ c:"C", d:"D" }, { c:"C", d:"D" }] };
                filter = { b:null };
                
                expectedObj = { a:"A" };
                assert.equal(JSON.stringify(filterFields(obj, filter)), JSON.stringify(expectedObj));
            });
        });
        
    });

    describe('Unexpected inputs', function(){
        it('filtering unused fields', function(){
                obj = { a:"A", b:"B", c:"C" };
                filter = { d:null };
                
                expectedObj = { a:"A", b:"B", c:"C" };
                assert.equal(JSON.stringify(filterFields(obj, filter)), JSON.stringify(expectedObj));
        });

        it('filtering used and unused fields', function(){
                obj = { a:"A", b:"B", c:"C" };
                filter = { a:null, d:null };
                
                expectedObj = { b:"B", c:"C" };
                assert.equal(JSON.stringify(filterFields(obj, filter)), JSON.stringify(expectedObj));
        });

        it('filtering fields out of order', function(){
                obj = { a:"A", b:"B", c:"C" };
                filter = { c:null, a:null };
                
                expectedObj = { b:"B" };
                assert.equal(JSON.stringify(filterFields(obj, filter)), JSON.stringify(expectedObj));
        });

        it('filtering with an empty filter', function(){
                obj = { a:"A", b:"B", c:"C" };
                filter = {};
                
                expectedObj = { a:"A", b:"B", c:"C" };
                assert.equal(JSON.stringify(filterFields(obj, filter)), JSON.stringify(expectedObj));
        });

        it('filtering with an empty object', function(){
                obj = {};
                filter = { a:null };
                
                expectedObj = {};
                assert.equal(JSON.stringify(filterFields(obj, filter)), JSON.stringify(expectedObj));
        });

        it('attempting to filter fields of a field', function(){
                obj = { a:"A" };
                filter = { a:{b:"B"} };
                
                expectedObj = { };
                assert.equal(JSON.stringify(filterFields(obj, filter)), JSON.stringify(expectedObj));
        });
    });
    
});

// Run XML based tests
describe('XML TESTS', function() { 
    describe('XML syntax', function() {
        it('Test 1 - check if it generates XML', function(){
            var obj = {foo:1};
            var expected = "\t<test>" + "\n" + "    <foo>1</foo>" + "\n" + "</test>\n";
            assert.equal(CSVConverter.convertObjectToXML(obj, false, false, "test"), expected);
        });
        
	it('Test 2 - check if it produces doctype', function() {
	    var obj = {foo:2};
	    var expected = '\t<?xml version=\'1.0\'?>\n<tests>\n<test>\n    <foo>2</foo>\n</test>\n';
	    assert.equal(CSVConverter.convertObjectToXML(obj, true, false, "test"), expected);
        });
	
	it('Test 3 - check if encloses the data object in correct tag', function() {
	    var obj = {foo:3};
	    var expected = '\t<test>\n' + '    <foo>3</foo>\n' + '</test>\n';
	    assert.equal(CSVConverter.convertObjectToXML(obj, false, false, "test"), expected);
	});
	it('Test 4 - check if the root tag is closed at the end', function() {
	    var obj = {foo:4};
	    var expected = '\t<test>\n' + '    <foo>4</foo>\n' + '</test>\n\n' + '</tests>';
	    assert.equal(CSVConverter.convertObjectToXML(obj, false, true, "test"), expected);
	});

	it('Test 5 - check null is returned when the value is null', function() {
	    var obj = {foo:null};
	    var expected = '\t<test>\n' + '    <foo>null</foo>\n' + '</test>\n';
	    assert.equal(CSVConverter.convertObjectToXML(obj, false, false, "test"), expected);
	});
	it('Test 6 - check special characters are escaped', function() {
	    var obj = {foo:"hello"};
	    var expected = '\t<test>\n' + '    <foo>hello</foo>\n' + '</test>\n\n';
	    assert.equal(CSVConverter.convertObjectToXML(obj, false, false, "test"), expected);
	});
	

   });
});



//Live testing:
let tokens = require("./setupenv");
let app = require("../app");
let chai = require("chai");
let chaiHttp = require("chai-http");
let chaiHelpers = require("./helpers");
let should = chai.should();
let expect = chai.expect;
chai.should();
chai.use(chaiHttp);
chai.use(chaiHelpers);

describe('Case Data', () => {
    describe('Single, unfiltered', () => {
        it('should get one case successfully', async () => {
            const res = await chai.getJSON("/case/1").send({});
            res.should.have.status(200);
            //rest of content tested elsewhere, just checking that it works here.
        });
        
        it('should get one case is CSV format', async () => {
            const res = await chai.request('http://localhost:3001').get("/case/1").set('accepts','text/csv').send({});
            console.log(res.body);
        });
            


    });

});






