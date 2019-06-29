const express = require('express')
const bodyParser = require('body-parser')
const bcrypt = require('bcryptjs')
const cors = require('cors')
const knex = require('knex')

const db = knex ({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'scot',
    password : 'scot',
    database : 'smart-brain'
  }
});


const app = express()
app.use(bodyParser.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send(database.users)
})

app.post('/signin', (req,res) => {
  db.select('email', 'hash').from('login')
    .where('email', '=', req.body.email)
    .then (data => {
      const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
      if (isValid) {
        return db.select('*').from('users')
          .where('email', '=', req.body.email)
          .then (user => {
            res.json(user[0])
          })
          .catch(err => res.status(400).json('Unable to get user'))
      } else {
        res.status(400).json('Incorrect email or password')
      }
    })
    .catch(err => res.status(400).json('Incorrect email or password'))
}) 

app.post('/register', (req, res) => {
  const {email, name, password} = req.body
  const hash = bcrypt.hashSync(password, 10)
    db.transaction (trx => {
      trx.insert ({
        hash: hash,
        email: email
      })
      .into('login')
      .returning('email')
      .then(loginEmail => {
        return trx ('users')
        .returning('*')
        .insert({
          email: loginEmail[0],
          name: name,
          joined: new Date()
      })
      .then(user => {
        res.json(user[0])
      })
      })
      .then(trx.commit)
      .catch(trx.rollback)
    })
  .catch(err => res.status(400).json('Unable to register you'))
})

app.get('/profile/:id', (req, res) => {
  const {id} = req.params
  db.select('*').from('users').
    where({id}).
    then(user => {
      if (user.length) {
        res.json(user[0])
      } else {
        res.status(400).json('No such user')
      }
      
    })
    .catch(err => res.status(400).json('Error getting user'))
})

app.put('/image', (req, res) => {
  const {id} = req.body
  db('users').where('id', '=', id)
  .increment('entries', 1)
  .returning('entries')
  .then(entries => {
    res.json(entries[0]);
  })
  .catch(err => res.status(400).json('Unable to update entry count'))
})


app.listen (3000, () => {
  console.log('app is running on port 3000')
})
