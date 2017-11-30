const convertToCSV = function(caseJSONList){
	
	var csvString = getCSVHeaders();
	var csvString = csvString + "\n";
	
	//Data:
	for (var i = 0; i<caseJSONList.length; i++){
		var caseJSON = caseJSONList[i];
		
		csvString = csvString + prepareValue(caseJSON["id"]) + ",";
		csvString = csvString + prepareValue(caseJSON["type"]) + ",";
		csvString = csvString + prepareValue(caseJSON["original_language"]) + ",";
		csvString = csvString + prepareValue(caseJSON["post_date"]) + ",";
		csvString = csvString + prepareValue(caseJSON["published"]) + ",";
		csvString = csvString + prepareValue(caseJSON["updated_date"]) + ",";
		csvString = csvString + formatLocation(caseJSON["location"]) + ",";
		csvString = csvString + formatListStructure(caseJSON["files"]) + ",";
		csvString = csvString + formatListStructure(caseJSON["tags"]) + ",";
		csvString = csvString + prepareValue(caseJSON["featured"]) + ",";
		csvString = csvString + prepareValue(caseJSON["issue"]) + ",";
		csvString = csvString + prepareValue(caseJSON["communication_mode"]) + ",";
		csvString = csvString + prepareValue(caseJSON["communication_with_audience"]) + ",";
		csvString = csvString + prepareValue(caseJSON["content_country"]) + ",";
		csvString = csvString + prepareValue(caseJSON["decision_method"]) + ",";
		csvString = csvString + prepareValue(caseJSON["end_date"]) + ",";
		csvString = csvString + prepareValue(caseJSON["facetoface_online_or_both"]) + ",";
		csvString = csvString + prepareValue(caseJSON["facilitated"]) + ",";
		csvString = csvString + prepareValue(caseJSON["voting"]) + ",";
		csvString = csvString + prepareValue(caseJSON["number_of_meeting_days"]) + ",";
		csvString = csvString + prepareValue(caseJSON["ongoing"]) + ",";
		csvString = csvString + prepareValue(caseJSON["start_date"]) + ",";
		csvString = csvString + prepareValue(caseJSON["total_number_of_participants"]) + ",";
		csvString = csvString + prepareValue(caseJSON["targeted_participant_demographic"]) + ",";
		csvString = csvString + prepareValue(caseJSON["kind_of_influence"]) + ",";
		csvString = csvString + prepareValue(caseJSON["targeted_participants_public_role"]) + ",";
		csvString = csvString + prepareValue(caseJSON["targeted_audience"]) + ",";
		csvString = csvString + prepareValue(caseJSON["participant_selection"]) + ",";
		csvString = csvString + prepareValue(caseJSON["specific_topic"]) + ",";
		csvString = csvString + prepareValue(caseJSON["staff_type"]) + ",";
		csvString = csvString + prepareValue(caseJSON["type_of_funding_entity"]) + ",";
		csvString = csvString + prepareValue(caseJSON["typical_implementing_entity"]) + ",";
		csvString = csvString + prepareValue(caseJSON["typical_sponsoring_entity"]) + ",";
		csvString = csvString + prepareValue(caseJSON["who_else_supported_the_initiative"]) + ",";
		csvString = csvString + prepareValue(caseJSON["who_was_primarily_responsible_for_organizing_the_initiative"]) + ",";
		csvString = csvString + formatListStructure(caseJSON["links"]) + ",";
		csvString = csvString + prepareValue(caseJSON["hidden"]) + ",";
		csvString = csvString + formatListStructure(caseJSON["videos"]) + ",";
		csvString = csvString + formatListStructure(caseJSON["images"]) + ",";
		csvString = csvString + prepareValue(caseJSON["body"]) + ",";
		csvString = csvString + prepareValue(caseJSON["title"]) + ",";
		csvString = csvString + formatAuthors(caseJSON["authors"]) + ",";
		csvString = csvString + formatListStructure(caseJSON["related_cases"]) + ",";
		csvString = csvString + formatListStructure(caseJSON["related_methods"]) + ",";
		csvString = csvString + formatListStructure(caseJSON["related_organizations"]) + ",";
		csvString = csvString + prepareValue(caseJSON["bookmarked"]) + "\n";
	}
	
	return csvString;
}


const getCSVHeaders = function(){
	
	var headers = "";
	headers = headers + "id,";
	headers = headers + "type,";
	headers = headers + "original_language,";
	headers = headers + "post_date,";
	headers = headers + "published,";
	headers = headers + "updated_date,";
	headers = headers + "location_name,";
	headers = headers + "location_address1,";
	headers = headers + "location_address2,";
	headers = headers + "location_city,";
	headers = headers + "location_province,";
	headers = headers + "location_country,";
	headers = headers + "location_postal_code,";
	headers = headers + "location_latitude,";
	headers = headers + "location_longitude,";
	headers = headers + "files_list,";
	headers = headers + "tags_list,";
	headers = headers + "featured,";
	headers = headers + "issue,";
	headers = headers + "communication_mode,";
	headers = headers + "communication_with_audience,";
	headers = headers + "content_country,";
	headers = headers + "decision_method,";
	headers = headers + "end_date,";
	headers = headers + "facetoface_online_or_both,";
	headers = headers + "facilitated,";
	headers = headers + "voting,";
	headers = headers + "number_of_meeting_days,";
	headers = headers + "ongoing,";
	headers = headers + "start_date,";
	headers = headers + "total_number_of_participants,";
	headers = headers + "targeted_participant_demographic,";
	headers = headers + "kind_of_influence,";
	headers = headers + "targeted_participants_public_role,";
	headers = headers + "targeted_audience,";
	headers = headers + "participant_selection,";
	headers = headers + "specific_topic,";
	headers = headers + "staff_type,";
	headers = headers + "type_of_funding_entity,";
	headers = headers + "typical_implementing_entity,";
	headers = headers + "typical_sponsoring_entity,";
	headers = headers + "who_else_supported_the_initiative,";
	headers = headers + "who_was_primarily_responsible_for_organizing_the_initiative,";
	headers = headers + "links_list,";
	headers = headers + "hidden,";
	headers = headers + "videos_list,";
	headers = headers + "images_list,";
	headers = headers + "body,";
	headers = headers + "title,";
	headers = headers + "authors_user_id,";
	headers = headers + "authors_timestamp,";
	headers = headers + "authors_name,";
	headers = headers + "related_cases_list,";
	headers = headers + "related_methods_list,";
	headers = headers + "related_organizations,";
	headers = headers + "bookmarked";
	
	return headers;
}

const generateCSV = function(jsonList){
    if(Array.isArray(jsonList) && jsonList.length > 0){
        //Use the first object to generate the headers, then fill in data.
        var csv = "";
        csv = csv + findColumnHeadingsForStructure(jsonList[0]);
        
        for (var i = 0; i < jsonList.length; i++){
            csv = csv + "\n";
            csv = csv + formatGenericStructure(jsonList[i]);
        }
        
        return csv;
    }else{
        return "";
    }
}


const formatGenericStructure = function(jsonObj){
    var row = "";

    var objKeys = Object.keys(jsonObj);
    for (var k = 0; k < objKeys.length; k++){
        var field = jsonObj[objKeys[k]];
    
        switch(typeof field){
            case 'object':
                //Could be an actual object, or an array
                if (Array.isArray(field)){
                    //if array has no elements, do nothing
                    if (field.length  == 0){
                        break;
                    }
                    //list of objects or list of primitives?
                    if (typeof field[0] == 'object'){
                        row = row + formatObjectList(field);
                    }else{
                        row = row + formatListStructure(field);
                    }
                }else{
                    //format an Object on it's own... recursion?
                    row = row + formatGenericStructure(field);
                }
                break;
            default:
                row = row + prepareValue(field);
        }
        row = row + ",";
    }
    
    //remove extra comma
    if (row.length !== 0){
        row = row.slice(0,-1);
    }
    
    return row;
}

//Should work so long as all object lists contain at least one of its objects :/
const findColumnHeadingsForStructure = function(jsonObj){
    var headers = "";
    var objKeys = Object.keys(jsonObj);
    for (var k = 0; k < objKeys.length; k++){
        var field = jsonObj[objKeys[k]];
    
        switch(typeof field){
            case 'object':
                //Could be an actual object, or an array
                if (Array.isArray(field)){
                    //if array has no elements, assume normal list??
                    if (field.length  == 0){
                        headers = headers + objKeys[k]+"_list";
                        break;
                    }
                    //list of objects or list of primitives?
                    if (typeof field[0] == 'object'){
                        fieldObjKeys = Object.keys(field[0]);
                        for (var fk = 0; fk < fieldObjKeys.length; fk++){
                            if (fk !== 0){
                                headers = headers + ",";
                            }
                            headers = headers + objKeys[k]+"_"+fieldObjKeys[fk]+"_list";
                        }
                        
                    }else{
                        headers = headers + objKeys[k]+"_list";
                    }
                }else{
                    //headers for Object on it's own
                    fieldObjKeys = Object.keys(field);
                    for (var fk = 0; fk < fieldObjKeys.length; fk++){
                        if (fk !== 0){
                            headers = headers + ",";
                        }
                        headers = headers + objKeys[k]+"_"+fieldObjKeys[fk];
                    }
                }
                break;
            default:
                headers = headers + objKeys[k];
        }
        headers = headers + ",";
    }
    //remove extra comma
    if (headers.length !== 0){
        headers = headers.slice(0,-1);
    }
    
    return headers;
}


const formatListStructure = function(list){
	var formattedList = "";
	for (var n = 0; n < list.length; n++){
		if (n != 0){
			formattedList = formattedList + "|";
		}
		formattedList = formattedList + prepareValue(list[n]);
	}
	return escapeBadCharacters(formattedList);
}

const formatObjectList = function(objList){
	var listsData = {};

	//Restructures data from a list of objects to an object containing lists.
	for (var i = 0; i < objList.length; i++){
		//loop through all keys for each object.
		for (var k = 0; k < Object.keys(objList[i]).length; k++){
			var key = Object.keys(objList[i])[k];
			//if the key is not seen before, create a new list under the same name. (should only happen on first object)
			if (!(key in listsData)){
				listsData[key] = [];
			}
			listsData[key].push(objList[i][key]);
		}
	}

	//Build a string containing all required columns in this list of objects.
	var returnString = "";
	for (var i = 0; i < Object.keys(listsData).length; i++){
		returnString = returnString + "," + formatListStructure(listsData[Object.keys(listsData)[i]]);
	}
	//remove leading ","
	returnString = returnString.substring(1);
	return returnString;
}

const formatAuthors = function(authorList){
	return formatObjectList(authorList);
}

const formatLocation = function(location){
	var formattedLocation = prepareValue(location["name"]) + ",";
	formattedLocation = formattedLocation + prepareValue(location["address1"]) + ",";
	formattedLocation = formattedLocation + prepareValue(location["address2"]) + ",";
	formattedLocation = formattedLocation + prepareValue(location["city"]) + ",";
	formattedLocation = formattedLocation + prepareValue(location["province"]) + ",";
	formattedLocation = formattedLocation + prepareValue(location["country"]) + ",";
	formattedLocation = formattedLocation + prepareValue(location["postal_code"]) + ",";
	formattedLocation = formattedLocation + prepareValue(location["latitude"]) + ",";
	formattedLocation = formattedLocation + prepareValue(location["longitude"]);
	return formattedLocation;
}


const prepareValue = function(val){
	if (val == null){
		return "";
	}else {
		return escapeBadCharacters(String(val));
	}
}

const escapeBadCharacters = function(val){
	if (val.indexOf(',') !== -1 || val.indexOf('|') !== -1){
		var val2 = val.replace(/"/g, '""');
		return '"' + val2 + '"';
	}else{
		return val;
	}
}


module.exports = {
    convertToCSV,
    generateCSV,
    prepareValue,
    formatListStructure,
    formatObjectList
}
