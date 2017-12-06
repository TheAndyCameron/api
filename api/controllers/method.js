"use strict";
const express = require("express");
const router = express.Router(); // eslint-disable-line new-cap
const cache = require("apicache");
const log = require("winston");

const { db, sql, as } = require("../helpers/db");

const CREATE_METHOD = sql("../sql/create_method.sql");

const {
  getEditXById,
  addRelatedList,
  returnThingByRequest,
  getThingByType_id_lang_userId
} = require("../helpers/things");

const {
  convertObjectToCSV,
  convertObjectToXML
} = require("../helpers/data_converters.js");


/**
 * @api {post} /method/new Create new method
 * @apiGroup Methods
 * @apiVersion 0.1.0
 * @apiName newMethod
 *
 * @apiSuccess {Boolean} OK true if call was successful
 * @apiSuccess {String[]} errors List of error strings (when `OK` is false)
 * @apiSuccess {Object} data method data
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
  // create new `method` in db
  // req.body *should* contain:
  //   title
  //   body (or "summary"?)
  //   photo
  //   video
  //   location
  //   related methods
  try {
    cache.clear();

    let title = req.body.title;
    let body = req.body.body || req.body.summary || "";
    let language = req.params.language || "en";
    if (!title) {
      return res.status(400).json({
        message: "Cannot create Method without at least a title"
      });
    }
    const user_id = req.user.user_id;
    const thing = await db.one(CREATE_METHOD, {
      title,
      body,
      language
    });
    req.thingid = thing.thingid;
    return getEditXById("method")(req, res);
  } catch (error) {
    log.error("Exception in POST /method/new => %s", error);
    return res.status(500).json({ OK: false, error: error });
  }
  // Refresh search index
  try {
    await db.none("REFRESH MATERIALIZED VIEW search_index_en;");
  } catch (error) {
    log.error("Exception in POST /method/new => %s", error);
  }
});

/**
 * @api {put} /method/:id  Submit a new version of a method
 * @apiGroup Methods
 * @apiVersion 0.1.0
 * @apiName editMethodById
 * @apiParam {Number} thingid Method ID
 *
 * @apiSuccess {Boolean} OK true if call was successful
 * @apiSuccess {String[]} errors List of error strings (when `OK` is false)
 * @apiSuccess {Object} data method data
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

router.put("/:thingid", getEditXById("method"));

/**
 * @api {get} /method/:id Get the last version of a method
 * @apiGroup Methods
 * @apiVersion 0.1.0
 * @apiName getMethodById
 * @apiParam {Number} id Method ID
 *
 * @apiSuccess {Boolean} OK true if call was successful
 * @apiSuccess {String[]} errors List of error strings (when `OK` is false)
 * @apiSuccess {Object} method data
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
 *
 */

router.get("/:thingid", function getMethodData(req, res){
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

        const filterJSON = req.body;
        
        if(req.params.thingid != 'all'){
            returnSingleThingByRequest("method",req,res,converterFunction,filterJSON);
        }else{
            returnAllThingsByRequest("method",req,res,converterFunction,filterJSON);
        }
    }catch (error){
        log.error("Exception in GET method data", req.params.thingid, error);
        res.status(500).json({ OK: false, error: error });
    }
});

/**
 * @api {delete} /method/:id Delete a method
 * @apiGroup Methods
 * @apiVersion 0.1.0
 * @apiName deleteMethod
 * @apiParam {Number} id Method ID
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

router.delete("/:id", function deleteMethod(req, res) {
  // let id = req.swagger.params.id.value;
  res.status(200).json(req.body);
});

module.exports = router;
