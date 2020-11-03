const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const User = require('../../models/User')
const jwt = require('jsonwebtoken');
const config = require('config');
const {check, validationResult} = require('express-validator');

// @Route   GET api/auth
// @Desc    Test Route
// @Access  Public
router.get('/', auth, async (req, res) => {
    try{
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// @Route   POST api/users
// @Desc    Register User
// @Access  Public
router.post('/',[
    check('email','EMail is required').isEmail(),
    check('password','Password is required').exists()
],
async (req, res) => {
    const errors = validationResult(req);
    if( !errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }

    const {password, email}  = req.body;
    //console.log(req.body);

    try{
        let user = await User.findOne({ email });
        if (!user){
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials'}]});
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch){
            return res.status(400).json({errors:[{ msg: 'Invalid Credentials'}]});
            //return res.status(400).json({errors:'Invalid Cred'});
        }

        //Return json webtoken
        const payload = {
            user: {
                id:user.id
            }
        };
        console.log('first');
        jwt.sign(payload, config.get('jwtSecret'), 
        { expiresIn:360000},
        (err, token) => {
            if (err) throw err;
            res.json({ token });
            res.send('Users');
        } );

    }catch(err){
        console.error(err.message);
        res.status(500).send('Server error');
    }

    //res.send('Users Registered'),
    console.log(req.body)
});

module.exports = router;