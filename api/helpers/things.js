let { isString } = require("lodash");
let log = require("winston");
const cache = require("apicache");
const equals = require("deep-equal");
const moment = require("moment");

const { okToFlipFeatured } = require("./user");
const { as, db, sql } = require("./db");

const {
  convertObjectToCSV,
  convertObjectToXML,
  getAllJSON
} = require("./data_converters.js");

const THING_BY_ID = sql(`../sql/thing_by_id.sql`);
const INSERT_LOCALIZED_TEXT = sql("../sql/insert_localized_text.sql");
const UPDATE_NOUN = sql("../sql/update_noun.sql");
const INSERT_AUTHOR = sql("../sql/insert_author.sql");
const IDS_FOR_TYPE = sql("../sql/ids_for_type.sql");

// Define the keys we're testing (move these to helper/things.js ?
const titleKeys = ["id", "title"];
const shortKeys = titleKeys.concat([
  "type",
  "images",
  "post_date",
  "updated_date"
]);
const mediumKeys = shortKeys.concat(["body", "bookmarked", "location"]);
const thingKeys = mediumKeys.concat([
  "original_language",
  "published",
  "files",
  "videos",
  "featured",
  "tags",
  "url"
]);
const caseKeys = thingKeys.concat([
  "issue",
  "communication_mode",
  "communication_with_audience",
  "content_country",
  "decision_method",
  "end_date",
  "facetoface_online_or_both",
  "facilitated",
  "voting",
  "number_of_meeting_days",
  "ongoing",
  "start_date",
  "total_number_of_participants",
  "targeted_participant_demographic",
  "kind_of_influence",
  "targeted_participants_public_role",
  "targeted_audience",
  "participant_selection",
  "specific_topic",
  "staff_type",
  "type_of_funding_entity",
  "typical_implementing_entity",
  "typical_sponsoring_entity",
  "who_else_supported_the_initiative",
  "who_was_primarily_responsible_for_organizing_the_initiative"
]);
const methodKeys = thingKeys.concat([
  "best_for",
  "communication_mode",
  "decision_mode",
  "facilitated",
  "governance_contribution",
  "issue_interdependency",
  "issue_polarization",
  "issue_technical_complexity",
  "kind_of_influence",
  "method_of_interaction",
  "public_interaction_method",
  "typical_funding_source",
  "typical_implementing_entity",
  "typical_sponsoring_entity"
]);
const organizationKeys = thingKeys.concat([
  "executive_director",
  "issue",
  "sector"
]);

function addRelatedList(owner_type, owner_id, related_type, id_list) {
  // TODO: escape id_list to avoid injection attacks
  if (!id_list || !id_list.length) {
    return "";
  }
  if (isString(id_list)) {
    id_list = [id_list];
  }
  owner_id = Number(owner_id);
  let values = id_list
    .map(item => {
      let escaped_id = Number(item.id);
      if (owner_id < escaped_id) {
        return `('${owner_type}', ${owner_id}, '${related_type}', ${
          escaped_id
        })`;
      } else {
        return `('${related_type}', ${escaped_id}, '${owner_type}', ${
          owner_id
        })`;
      }
    })
    .join(", ");
  return `
  INSERT INTO related_nouns (type_1, id_1, type_2, id_2)
  VALUES ${values};`;
}

function removeRelatedList(owner_type, owner_id, related_type, id_list) {
  // TODO: escape id_list to avoid injection attacks
  if (!id_list || !id_list.length) {
    return "";
  }
  if (isString(id_list)) {
    id_list = [id_list];
  }
  owner_id = Number(owner_id);
  return id_list
    .map(item => {
      let escaped_id = Number(item.id);
      if (`${owner_type}${owner_id}` < `${related_type}${escaped_id}`) {
        return `DELETE FROM related_nouns
                WHERE type_1 = '${owner_type}' AND id_1 = ${owner_id} AND
                      type_2 = '${related_type}' AND id_2 = ${id};`;
      } else {
        return `DELETE FROM related_nouns
                WHERE type_1 = '${related_type}' AND id_1 = ${escaped_id} AND
                      type_2 = '${owner_type}' AND id_2 = ${owner_id};`;
      }
    })
    .join("");
}

const difference = (set1, set2) => new Set([...set1].filter(x => !set2.has(x)));

function diffRelatedList(first, second) {
  // both lists are related_item objects of the same type
  const first_set = new Set(first.map(rel => rel.id));
  const second_set = new Set(second.map(rel => rel.id));
  remove_set = difference(first_set, second_set);
  add_set = difference(second_set, first_set);
  const remove = first.filter(x => remove_set.has(x.id));
  const add = second.filter(x => add_set.has(x.id));
  return { remove, add };
}

const getThingByType_id_lang_userId = async function(
  type,
  thingid,
  lang,
  userId
) {
  let table = type + "s";

  const thing = await db.one(THING_BY_ID, {
    table,
    type,
    thingid,
    lang,
    userId
  });
  return thing.results;
};

const getThingByRequest = async function(type, req) {
  const thingid = as.number(req.params.thingid);
  const lang = as.value(req.params.language || "en");
  const userId = req.user ? req.user.user_id : null;
  return await getThingByType_id_lang_userId(type, thingid, lang, userId);
};

const returnThingByRequest = async function(type, req, res) {
  try {
    const thing = await getThingByRequest(type, req);
    res.status(200).json({ OK: true, data: thing });
  } catch (error) {
    log.error("Exception in GET /%s/%s => %s", type, req.params.thingid, error);
    res.status(500).json({
      OK: false,
      error: error
    });
  }
};

/* Used to return a single thing to the requester, including processes of retrieval, 
 * field filtering, conversion, and sending. 
 */
const returnSingleThingByRequest = async function(thingtype, req, res){
    try{
        const interpretedParams = getParameters(req);
        const converterFunction = interpretedParams[0];
        const filterJson = interpretedParams[1];

        //Get the data, filter the fields and convert to appropriate format
        var thingJson = await getThingByRequest(thingtype, req);
        thingJson = filterFields(thingJson, filterJson);
        var thing = converterFunction(thingJson, true, true, thingtype);
        
        //send data:
        setHeadersForRes(req, res, thingtype, false);
        if(typeof thing == 'object'){
            res.status(200).json(thing);
        }else{
            res.status(200).send(thing);
        }
    }catch(error){
        log.error("Exception in GET single " + thingtype + " data", req.params.thingid, error);
        res.status(500).json({ OK: false, error: error });
    }
};

/* Used to return all things of a particular type to the requester, including processes  
 * of retrieval, field filtering, conversion, and sending. 
 */
const returnAllThingsByRequest = async function(thingtype, req, res){
    try {
        const interpretedParams = getParameters(req);
        const converterFunction = interpretedParams[0];
        const filterJson = interpretedParams[1];

        const ids = await db.any(IDS_FOR_TYPE, { thingtype });
        setHeadersForRes(req, res, thingtype, true);
        var counter = 0;
    
        ids.forEach(async function(row){
            req.params.thingid = Number(row.id);
            var thingJson = await getThingByRequest(thingtype, req);
            thingJson = filterFields(thingJson, filterJson);
            var thing;
            
            thing = converterFunction(thingJson, counter==0, counter == (ids.length-1), thingtype);
            res.write(thing);
            
            counter++;
            if (counter == ids.length){
                res.end();
            }
        });
    } catch (error) {
        log.error("Exception in GET all " + thingtype + " data", req.params.thingid, error);
        res.status(500).json({ OK: false, error: error });
    }
};

const getParameters = function(req){
    //Determine the converter to use. Normal JSON as default.
    var converterFunction;
    if (req.accepts('application/json')){
        converterFunction = getAllJSON; //function(thing, first, last, thingtype){return { OK: true, data: thing }};
    }else if(req.accepts('application/xml')){
        converterFunction = convertObjectToXML;
    }else if(req.accepts('text/csv')){
        converterFunction = convertObjectToCSV;
    }

    //Only filter if an object is provided.
    var filterJSON = {};
    if(typeof req.query.filter == 'string' && req.query.filter != ''){
        filterJSON = JSON.parse(unescape(req.query.filter));
    }

    return [converterFunction, filterJSON];
}

/* Removes all (nested) keys of filterObj from obj.
 */
const filterFields = function(obj, filterObj){
    if(typeof filterObj != 'object' || filterObj == null){
        return obj;
    }
    
    const keys = Object.keys(filterObj);
    for(var k = 0; k < keys.length; k++){
        //if null, remove entire object
        if(filterObj[keys[k]] == null){
            delete obj[keys[k]];
        }
        switch (typeof obj[keys[k]]){
            case 'object':
                //Filter fields in nested object. or for all nested objects in array.
                if (Array.isArray(obj[keys[k]])){
                    //if an array of single values, just remove and continue.
                    if(obj[keys[k]].length != 0 && typeof obj[keys[k]][0] != 'object'){
                        delete obj[keys[k]];
                        continue;
                    }
                    //array of objects, remove any nested fields that need removing.
                    for(var i = 0; i < obj[keys[k]].length; i++){
                        filterFields(obj[keys[k]][i], filterObj[keys[k]]);
                    }
                }else{
                    //single object, remove nested fields that need removing.
                    filterFields(obj[keys[k]], filterObj[keys[k]]);
                }
                break;
            default:
                //Single value of key to be filtered out.
                delete obj[keys[k]];
        }
        
    }
    
    return obj;
}

/* Sets the res headers for content-type and the attachment file name.
 */
const setHeadersForRes = function(req, res, type, isAll){
    //Set attachment file name if xml or csv
    var filename = type;
    if(isAll){
        filename = "all" + type + "s";
    }
    if (req.accepts('application/json')){
        res.setHeader('content-type', 'application/json');
    }else if (req.accepts('application/xml')){
        res.setHeader('content-type', 'application/xml; charset=utf-8');
        res.setHeader('content-disposition', 'attachment; filename=' + filename + '.xml');
    }else if (req.accepts('text/csv')){
        res.setHeader('content-type', 'text/csv; charset=utf-8');
        res.setHeader('content-disposition', 'attachment; filename=' + filename + '.csv');
    }
}

function getEditXById(type) {
  return async function editById(req, res) {
    cache.clear();
    const thingid = req.thingid || as.number(req.params.thingid);
    try {
      // FIXME: Figure out how to get all of this done as one transaction
      const lang = as.value(req.params.language || "en");
      const user = req.user;
      const userId = user.user_id;
      const oldThing = await getThingByType_id_lang_userId(
        type,
        thingid,
        lang,
        userId
      );
      const newThing = req.body;
      let updatedText = {
        body: oldThing.body,
        title: oldThing.title,
        language: lang,
        type: type,
        id: thingid
      };
      let updatedThingFields = [];
      let isTextUpdated = false;
      let anyChanges = false;
      let retThing = null;

      /* DO ALL THE DIFFS */
      Object.keys(oldThing).forEach(async key => {
        if (
          // All the ways to check if a value has not changed
          newThing[key] === undefined ||
          equals(oldThing[key], newThing[key]) ||
          (/_date/.test(key) &&
            moment(oldThing[key]).format() ===
              moment(newThing[key]).format()) ||
          (/related_/.test(key) &&
            equals(
              oldThing[key].map(x => x.id),
              newThing[key].map(x => x.id || x.value)
            ))
        ) {
          // skip, do nothing, no change for this key
        } else if (!equals(oldThing[key], newThing[key])) {
          anyChanges = true;
          // If the body or title have changed: add a record in localized_texts
          if (key === "body" || key === "title") {
            updatedText[key] = newThing[key];
            isTextUpdated = true;
            // If related_cases, related_methods, or related_organizations have changed
            // update records in related_nouns
          } else if (
            [
              "related_cases",
              "related_methods",
              "related_organizations"
            ].includes(key)
          ) {
            // DELETE / INSERT any needed rows for related_nouns
            let oldList = oldThing[key];
            if (oldList.length && oldList[0].id === undefined) {
              oldList = oldList.map(x => {
                id: x;
              });
            }
            let newList = newThing[key];
            if (
              newList.length &&
              newList[0].id === undefined &&
              newList[0].value === undefined
            ) {
              newList = newList.map(function(x) {
                return { id: Number(x) };
              });
            }
            newList.forEach(x => (x.id = x.id || x.value)); // handle client returning value vs. id
            const diff = diffRelatedList(oldList, newList);
            const relType = key.split("_")[1].slice(0, -1); // related_Xs => X
            const add = addRelatedList(type, thingid, relType, diff.add);
            const remove = removeRelatedList(
              type,
              thingid,
              relType,
              diff.remove
            );
            if (add || remove) {
              await db.none(add + remove);
            }
            anyChanges = true;
            // If any of the fields of thing itself have changed, update record in appropriate table
          } else if (
            ["id", "post_date", "updated_date", "authors"].includes(key)
          ) {
            log.warn(
              "Trying to update a field users shouldn't update: %s",
              key
            );
            // take no action
          } else if (key === "featured") {
            if (okToFlipFeatured(user)) {
              updatedThingFields.push({
                key: as.name(key),
                value: Boolean(newThing[key])
              });
            } else {
              log.warn("Non-curator trying to update Featured flag");
              // take no action
            }
          } else if (key === "location") {
            updatedThingFields.push({
              key: as.name(key),
              value: as.location(newThing[key])
            });
          } else if (["tags", "links"].includes(key)) {
            updatedThingFields.push({
              key: as.name(key),
              value: as.tags(newThing[key])
            });
          } else if (key === "videos") {
            updatedThingFields.push({
              key: as.name(key),
              value: as.videos(newThing[key])
            });
          } else if (key === "images") {
            updatedThingFields.push({
              key: as.name(key),
              value: as.strings(newThing[key])
            });
          } else if (key === "files") {
            updatedThingFields.push({
              key: as.name(key),
              value: as.attachments(newThing[key])
            });
          } else {
            let value = newThing[key];
            let asValue = as.text;
            if (typeof value === "boolean") {
              asValue = as.value;
            } else if (value === null) {
              value = "null";
              asValue = as.value;
            } else if (typeof value === "number") {
              asValue = as.number;
            }
            updatedThingFields.push({
              key: as.name(key),
              value: asValue(value)
            });
          }
        }
      }); // end of for loop over object keys
      if (true) {
        // Actually make the changes
        if (isTextUpdated) {
          // INSERT new text row
          await db.none(INSERT_LOCALIZED_TEXT, updatedText);
        }
        // Update last_updated
        updatedThingFields.push({ key: "updated_date", value: as.text("now") });
        // UPDATE the thing row
        await db.none(UPDATE_NOUN, {
          keyvalues: updatedThingFields
            .map(field => field.key + " = " + field.value)
            .join(", "),
          type: type,
          id: thingid
        });
        // INSERT row for X__authors
        await db.none(INSERT_AUTHOR, {
          user_id: userId,
          type: type,
          id: thingid
        });
        // update materialized view for search
        retThing = await getThingByType_id_lang_userId(
          type,
          as.number(thingid),
          lang,
          userId
        );
        if (req.thingid) {
          res.status(201).json({
            OK: true,
            data: { thingid: retThing.id },
            object: retThing
          });
        } else {
          res.status(200).json({ OK: true, data: retThing });
        }
      }
    } catch (error) {
      log.error(
        "Exception in PUT /%s/%s => %s",
        type,
        req.thingid || thingid,
        error
      );
      console.trace(error);
      res.status(500).json({
        OK: false,
        error: error
      });
    } // end catch
    // update search index
    try {
      await db.none("REFRESH MATERIALIZED VIEW search_index_en;");
    } catch (error) {
      console.error("Problem refreshing materialized view: %s", error);
    }
  };
}

const getAllFields = async function(req, res) {
    


}


const supportedTypes = ["case", "method", "organization"];

module.exports = {
  addRelatedList,
  removeRelatedList,
  getThingByType_id_lang_userId,
  getThingByRequest,
  returnThingByRequest,
  returnSingleThingByRequest,
  returnAllThingsByRequest,
  filterFields,
  diffRelatedList,
  difference,
  getEditXById,
  supportedTypes,
  titleKeys,
  shortKeys,
  mediumKeys,
  thingKeys,
  caseKeys,
  methodKeys,
  organizationKeys
};
