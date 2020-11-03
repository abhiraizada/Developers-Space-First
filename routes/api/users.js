const express = require('express');
const gravatar = require('gravatar');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../../models/User')

const {check, validationResult} = require('express-validator');

// @Route   POST api/users
// @Desc    Register User
// @Access  Public
router.post('/',[
    check('name','Name is required').not().isEmpty(),
    check('email','EMail is required').isEmail(),
    check('password','Password length must be minimum 6').isLength({ min:6 })
],
async (req, res) => {
    const errors = validationResult(req);
    if( !errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }

    const {name,password,email}  = req.body;

    try{
        let user = await User.findOne({ email });
        if (user){
            return res.status(400).json({ errors: [{ msg: 'User Already Exists'}]})
        }
        //Get users gravatar
        const avatar = gravatar.url( email, {
            s:'200',
            r:'pg',
            d:'mm'
        })

        user = new User({
            name,
            email,
            password,
            avatar
        });
        //Encryt password
        const salt = await bcrypt.genSalt(10);

        user.password = await bcrypt.hash(password, salt);
        await user.save();
        //Return json webtoken
        const payload = {
            user: {
                id:user.id
            }
        };
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