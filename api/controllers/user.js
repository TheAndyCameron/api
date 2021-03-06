"use strict";
let express = require("express");
let router = express.Router(); // eslint-disable-line new-cap
let cache = require("apicache");
let log = require("winston");
let { db, sql, as } = require("../helpers/db");

const USER_BY_ID = sql("../sql/user_by_id.sql");
const UPDATE_USER = sql("../sql/update_user.sql");

function conform_location(location) {
  let {
    name,
    postal_code,
    city,
    province,
    country,
    address_1,
    address_2
  } = location;
  name = as.text(name || "");
  postal_code = as.text(postal_code || "");
  city = as.text(city || "");
  province = as.text(province || "");
  country = as.text(country || "");
  address_1 = as.text(address_1 || "");
  address_2 = as.text(address_2 || "");
  const latitude = as.text(String(location.latitude));
  const longitude = as.text(String(location.longitude));
  return `(${name}, ${address_1}, ${address_2}, ${city}, ${province}, ${country}, ${postal_code}, ${latitude}, ${longitude})::geolocation`;
}

async function getUserById(userId, req, res) {
  try {
    const result = await db.oneOrNone(USER_BY_ID, {
      userId: userId,
      language: req.params.language || "en"
    });
    if (!result) {
      return res
        .status(404)
        .json({ OK: false, error: `User not found for user_id ${userId}` });
    }
    res.status(200).json({ OK: true, data: result.user });
  } catch (error) {
    log.error("Exception in GET /user/%s => %s", userId, error);
    console.trace(error);
    if (error.message && error.message == "No data returned from the query.") {
      res.status(404).json({ OK: false });
    } else {
      res.status(500).json({ OK: false, error: error });
    }
  }
}

/**
 * @api {get} /user/:userId Retrieve a user
 * @apiGroup users
 * @apiVersion 0.1.0
 * @apiName getUserById
 * @apiParam {Number} userId user ID
 *
 * @apiSuccess {Boolean} OK true if call was successful
 * @apiSuccess {data} User object if call was successful
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
router.get("/:userId", function(req, res) {
  try {
    return getUserById(req.params.userId || req.user.user_id, req, res);
  } catch (error) {
    console.error("Problem in /user/:userId");
    console.trace(error);
  }
});

router.get("/", async function(req, res) {
  try {
    if (!req.user) {
      return res.status(404).json({
        message: "No user found"
      });
    }
    return getUserById(req.user.user_id, req, res);
  } catch (error) {
    console.error("Problem in /user/");
    console.trace(error);
  }
});

/**
 * @api {post} /user Update a user's own profile
 * @apiGroup users
 * @apiVersion 0.1.0
 * @apiName getUserById
 * @apiParam {Number} userId user ID
 *
 * @apiSuccess {Boolean} OK true if call was successful
 * @apiSuccess {data} User object if call was successful
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
router.post("/", async function(req, res) {
  try {
    let user = req.body;
    let pictureUrl = user.picture_url || user.picture;
    if (user.user_metadata && user.user_metadata.customPic) {
      pictureUrl = user.user_metadata.customPic;
    }
    let location = conform_location(user.location);
    await db.none(UPDATE_USER, {
      id: user.id,
      name: user.name,
      language: req.params.language || "en",
      picture_url: pictureUrl,
      bio: user.bio || "",
      title: user.title || "",
      affiliation: user.affiliation || "",
      location: location,
      department: user.department || "",
      website: user.website || "",
      organization: user.organization || null
    });
    res.status(200).json({ OK: true });
  } catch (error) {
    log.error("Exception in POST /user => %s", error);
    if (error.message && error.message == "No data returned from the query.") {
      res.status(404).json({ OK: false });
    } else {
      res.status(500).json({ OK: false, error: error });
      console.trace(error);
    }
  }
});

/**
 * @api {delete} /user/:userId Delete a user
 * @apiGroup users
 * @apiVersion 0.1.0
 * @apiName deleteuser
 * @apiParam {Number} userId user ID
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

router.delete("/:userId", function edituserById(req, res) {
  cache.clear();
  // let userId = req.swagger.params.userId.value;
  // let userBody = req.body;
  res.status(200).json(req.body);
});

module.exports = router;
