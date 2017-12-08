var assert = require("assert");
var XMLDataFile = require("../api/helpers/data_converters.js");

// Test for the xml converter function
describe('XML TESTS', function(){
    describe('XML syntax', function() {
        it('Test 1 - check if it generates XML', function(){
            var obj = {foo:1};
            var expected = "\t<test>" + "\n" + "    <foo>1</foo>" + "\n" + "</test>\n";
            assert.equal(XMLDataFile.convertObjectToXML(obj, false, false, "test"), expected);
        });
        
	it('Test 2 - check if it produces doctype', function() {
	    var obj = {foo:2};
	    var expected = '\t<?xml version=\'1.0\'?>\n<tests>\n<test>\n    <foo>2</foo>\n</test>\n';
	    assert.equal(XMLDataFile.convertObjectToXML(obj, true, false, "test"), expected);
        });
	
	it('Test 3 - check if encloses the data object in correct tag', function() {
	    var obj = {foo:3};
	    var expected = '\t<test>\n' + '    <foo>3</foo>\n' + '</test>\n';
	    assert.equal(XMLDataFile.convertObjectToXML(obj, false, false, "test"), expected);
	});
	it('Test 4 - check if the root tag is closed at the end', function() {
	    var obj = {foo:4};
	    var expected = '\t<test>\n' + '    <foo>4</foo>\n' + '</test>\n\n' + '</tests>';
	    assert.equal(XMLDataFile.convertObjectToXML(obj, false, true, "test"), expected);
	});

   });
});

