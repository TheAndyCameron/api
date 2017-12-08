"use strict";

const express = require("express");
const router = express.Router(); // eslint-disable-line new-cap
const cache = require("apicache");
const log = require("winston");
const template = require("../helpers/template");

const { db, sql, as } = require("../helpers/db");

const CREATE_ORGANIZATION = sql("../sql/create_organization.sql");

const {
  getEditXById,
  addRelatedList,
  returnThingByRequest,
  getThingByType_id_lang_userId,
  returnSingleThingByRequest,
  returnAllThingsByRequest
} = require("../helpers/things");

const {
  convertObjectToCSV,
  convertObjectToXML
} = require("../helpers/data_converters.js");


/**
 * @api {post} /organization/new Create new organization
 * @apiGroup Organizations
 * @apiVersion 0.1.0
 * @apiName newOrganization
 *
 * @apiSuccess {Boolean} OK true if call was successful
 * @apiSuccess {String[]} errors List of error strings (when `OK` is false)
 * @apiSuccess {Object} organization data
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "OK": true,
 *       "data": {
 *         "ID": 3,
 *         "Description": 'foo'
 *        }
 *     }
 *
 * @apiError NotAuthenticated The user is not authenticated
 * @apiError NotAuthorized The user doesn't have permission to perform this operation.
 *
 */
router.post("/new", async function(req, res) {
  // create new `organization` in db
  // req.body *should* contain:
  //   title
  //   body (or "summary"?)
  //   photo
  //   video
  //   location
  //   related organizations
  try {
    cache.clear();

    let title = req.body.title;
    let body = req.body.body || req.body.summary || "";
    let language = req.params.language || "en";
    if (!title) {
      return res.status(400).json({
        message: "Cannot create Organization without at least a title"
      });
    }
    const user_id = req.user.user_id;
    const thing = await db.one(CREATE_ORGANIZATION, {
      title,
      body,
      language
    });
    req.thingid = thing.thingid;
    return getEditXById("organization")(req, res);
  } catch (error) {
    log.error("Exception in POST /organization/new => %s", error);
    return res.status(500).json({ OK: false, error: error });
  }
  // Refresh search index
  try {
    await db.none("REFRESH MATERIALIZED VIEW search_index_en;");
  } catch (error) {
    log.error("Exception in POST /organization/new => %s", error);
  }
});

/**
 * @api {put} /organization/:id  Submit a new version of a organization
 * @apiGroup Organizations
 * @apiVersion 0.1.0
 * @apiName editOrganization
 * @apiParam {Number} id Organization ID
 *
 * @apiSuccess {Boolean} OK true if call was successful
 * @apiSuccess {String[]} errors List of error strings (when `OK` is false)
 * @apiSuccess {Object} organization data
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "OK": true,
 *       "data": {
 *         "ID": 3,
 *         "Description": 'foo'
 *        }
 *     }
 *
 * @apiError NotAuthenticated The user is not authenticated
 * @apiError NotAuthorized The user doesn't have permission to perform this operation.
 *
 */

router.put("/:thingid", getEditXById("organization"));

/**
 * @api {get} /organization/:id Get the last version of an organization
 * @apiGroup Organizations
 * @apiVersion 0.1.0
 * @apiName getOrgById
 * @apiParam {Number} id Organization ID
 *
 * @apiSuccess {Boolean} OK true if call was successful
 * @apiSuccess {String[]} errors List of error strings (when `OK` is false)
 * @apiSuccess {Object} Organization data
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "OK": true,
 *       "data": {
 *         "ID": 3,
 *         "Description": 'foo'
 *        }
 *     }
 *
 * @apiError NotAuthenticated The user is not authenticated
 * @apiError NotAuthorized The user doesn't have permission to perform this operation.
 *
 */

router.get("/:thingid", function getOrganizationData(req, res){
    try{
        //Determine the converter to use. Normal JSON as default.
        var converterFunction;
        if (req.accepts('application/json')){
            converterFunction = function(thing, first, last, thingtype){return { OK: true, data: thing }};
        }else if(req.accepts('application/xml')){
            converterFunction = convertObjectToXML;
        }else if(req.accepts('text/csv')){
            converterFunction = convertObjectToCSV;
        }

        //const filterJSON = JSON.parse(unescape(req.query.filter));
        const filterJSON = req.body;

        if(req.params.thingid == 'all'){
            returnAllThingsByRequest("organization",req,res,converterFunction,filterJSON); 
        } else if(req.params.thingid == 'fields') {
	    res.status(200).json(template.organizationTemplate);
	} else{
	    returnSingleThingByRequest("organization",req,res,converterFunction,filterJSON)
           
        }
    }catch (error){
        log.error("Exception in GET organization data", req.params.thingid, error);
        res.status(500).json({ OK: false, error: error });
    }
});

/**
 * @api {delete} /organization/:id Delete an organization
 * @apiGroup Organizations
 * @apiVersion 0.1.0
 * @apiName deleteOrganization
 * @apiParam {Number} Organization ID
 *
 * @apiSuccess {Boolean} OK true if call was successful
 * @apiSuccess {String[]} errors List of error strings (when `OK` is false)
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *        OK: true
 *     }
 *
 * @apiError NotAuthenticated The user is not authenticated
 * @apiError NotAuthorized The user doesn't have permission to perform this operation.
 *
 */

router.delete("/:id", function deleteOrganization(req, res) {
  // let orgId = req.swagger.params.id.value;
  res.status(200).json(req.body);
});

module.exports = router;
