// /api/post/members/search

const router = require("express").Router();

const rootDir = process.env.CWD;

const Models = require(rootDir + "/app/models/sequelize");
const Members = Models.Members;

const Auth = require(rootDir + "/app/controllers/auth");

router.post("/", Auth.isLoggedIn, async (req, res) => {
  try {
    const term = req.body.term;

    if (!term) {
      return res.send({
        status: "ok",
        results: [],
      });
    }

    const members = await Members.searchByName(term);

    const sanitizedMembers = [];

    for await (const member of members) {
      const sanitizedMember = await Members.sanitizeMember(member, req.user);
      if (sanitizedMember) {
        sanitizedMembers.push(sanitizedMember);
      }
    }

    res.send({
      status: "ok",
      results: sanitizedMembers,
    });
  } catch (error) {
    res.send({
      status: "fail",
      results: [],
    });
  }
});

router.post("/simple", Auth.isLoggedIn, async (req, res) => {
  try {
    const term = req.body.term;

    if (!term) {
      return res.send({
        status: "ok",
        results: [],
      });
    }

    const members = await Members.searchByName(term);

    const sanitizedMembers = [];

    for await (const member of members) {
      const sanitizedMember = await Members.sanitizeMember(member, req.user);
      if (sanitizedMember) {
        sanitizedMember.id = member.member_id;
        sanitizedMember.membership_expires = sanitizedMember.current_exp_membership;
        sanitizedMembers.push(sanitizedMember);
      }
    }

    res.send({
      status: "ok",
      results: sanitizedMembers,
    });
  } catch (error) {
    res.send({
      status: "fail",
      results: [],
    });
  }
});

module.exports = router;
