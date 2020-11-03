const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const auth = require('../../middleware/auth');
const {check, validationResult, body} = require('express-validator');
const { findOne } = require('../../models/User');
const { response } = require('express');
const request = require('request');
const config = require('config');

// @Route   GET api/profile/me
// @Desc    Get current user's Profile
// @Access  Private
router.get('/me', auth, async (req, res) =>{
    try{
        const profile = await Profile.findOne({ user: req.user.id }).populate(
            'user',['name','avatar']
            );
        if (!profile){
            return res.status(400).json({msg:'THere is no profile for this user'});
        }
        res.json(profile);
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
} );

// @Route   POST api/profile/me
// @Desc    create or update user's profile
// @Access  Private

router.post(
    '/',
    [
        auth, 
        [
            check('status', 'Status is required').not().isEmpty(),
            check('skills' , 'Skills is required').not().isEmpty()
        ]
    ], 
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            return res.status(400).json({ errors:errors.array() });
        }

        const {
            company,
            website,
            location,
            bio,
            status,
            githubusername,
            skills,
            youtube,
            facebook,
            twitter,
            instagram,
            linkedin
        } = req.body;
        
        //Build profile object
        const profileFields ={};
        profileFields.user = req.user.id;
        if (company) profileFields.company = company;
        if (website) profileFields.wensite = website;
        if (location) profileFields.location = location;
        if (bio) profileFields.bio = bio;
        if (status) profileFields.status = status;
        if (githubusername) profileFields.githubusername = githubusername;
        if (skills){
            profileFields.skills = skills.split(',').map(skill => skill.trim());
        }

        console.log(profileFields.skills);

        profileFields.social = {}
            if (youtube) profileFields.social.youtube = youtube;
            if (facebook) profileFields.social.facebook = facebook;
            if (linkedin) profileFields.social.linkedin = linkedin;
            if (instagram) profileFields.social.instagram = instagram;
            if (twitter) profileFields.social.twitter = twitter;

        try {
            let profile = await Profile.findOne({ user: req.user.id });
            
            if (profile){
                //Update
                profile = await Profile.findOneAndUpdate(
                    { user: req.user.id},
                    { $set: profileFields},
                    { new: true}
                );
                return res.json(profile);
            }

                //Create
                profile = new Profile(profileFields);
                await profile.save();
                res.json(profile);
            
        } catch(err){
            console.error(err.message);
            res.status(500).send('Server Error');
        }

        res.send('Hello!');
    }
    );

// @Route   GET api/profiles/
// @Desc    Get all profiles
// @Access  Public   
router.get('/', async(req,res) =>{
    try {
        const profiles = await Profile.find().populate('user',['name','avatar']);
        res.json(profiles)
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

// @Route   GET api/profiles/user/:user_id
// @Desc    Get profile by user_id
// @Access  Public   
router.get('/user/:user_id', async(req,res) =>{
    try {
        const profile = await Profile.findOne({
            user : req.params.user_id
        }).populate('user',['name','avatar']);

        if (!profile) return res.status(400).json({msg:'Profile not found'});
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        console.log(err.kind);
        if(err.kind == 'ObjectId'){
            console.log('inside');
            return res.status(400).json({msg:'Profile not found'});
        }
        res.status(500).send('Server Error');
    }
})

// @Route   DELETE api/profiles/
// @Desc    Delete profile, user and posts
// @Access  Private
router.delete('/', auth, async(req,res) =>{
    try {
        //@Todo Delete Posts

        //Remove user profile
        await Profile.findOneAndRemove({ user:req.user.id});
        //Remove User
        await User.findOneAndRemove({ _id:req.user.id});
        res.json({msg: 'User and Profile Deleted'});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

// @Route   PUT api/profiles/experience
// @Desc    Add profile experience
// @Access  Private
router.put('/experience', 
    [ auth, 
        [ 
            check('title','Title is required').not().isEmpty(),
            check('company','Company is required').not().isEmpty(),
            check('from','From Date is required').not().isEmpty()
        ] 
    ],
    async(req,res) =>{
        const errors = validationResult(req);
        if (!errors.isEmpty){
            return res.status(400).json({ errors:errors.array()});
        }

        const {
            title,
            company,
            location,
            from,
            to,
            description
        } = req.body;

        const newExp = {
            title,
            company,
            from,
            to,
            location,
            description
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id });
            profile.experience.unshift(newExp);
            await profile.save();
            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }

    } 
);

// @Route   DELETE api/profiles/experience/:exp_id
// @Desc    Delete experience
// @Access  Private
router.delete('/experience/:exp_id',auth,async(req,res)=>{
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        
        //Get Remove Index
        const removeIndex = profile.experience
        .map(item => item.id)
        .indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

// @Route   PUT api/profiles/education
// @Desc    Add profile education
// @Access  Private
router.put('/education', 
    [ auth, 
        [ 
            check('school','School is required').not().isEmpty(),
            check('degree','Degree is required').not().isEmpty(),
            check('from','From Date is required').not().isEmpty()
        ] 
    ],
    async(req,res) =>{
        const errors = validationResult(req);
        if (!errors.isEmpty){
            return res.status(400).json({ errors:errors.array()});
        }

        const {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            description
        } = req.body;

        const newEdu = {
            school,
            degree,
            fieldofstudy,
            to,
            from,
            description
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id });
            profile.education.unshift(newEdu);
            await profile.save();
            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }

    } 
);

// @Route   DELETE api/profiles/education/:edu_id
// @Desc    Delete education
// @Access  Private
router.delete('/education/:edu_id',auth,async(req,res)=>{
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        
        //Get Remove Index
        const removeIndex = profile.education
        .map(item => item.id)
        .indexOf(req.params.edu_id);
        profile.education.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

// @route    GET api/profile/github/:username
// @desc     Get user repos from Github
// @access   Public
router.get('/github/:username',(req,res)=>{
    try {
        const options = {
            uri: `https://api.github.com/users/${
                req.params.username
            }/repos?per_page=5&sort=created:asc&client_id=${config.get(
                'githubClientId'
            )}&client_secret=${config.get('githubSecret')}`,
            method: 'GET',
            headers: {'user-agent': 'node.js'}
        };
        console.log(options.uri);

        request(options,(error,response,body)=>{
            if(error) console.error(error);
            if(response.statusCode !== 200){
                return res.status(404).json({ msg: 'No Github profile found'});
            }
            res.json(JSON.parse(body));
        });
    } catch (err) {
        //console.log('heh;');
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;