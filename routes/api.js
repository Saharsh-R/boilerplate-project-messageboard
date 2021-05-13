'use strict';

require('dotenv').config()
let mongoose = require("mongoose");
mongoose.pluralize(null);
mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true ,useFindAndModify: false});

const replySchema = new mongoose.Schema({
  text: String,
  delete_password : String,
  reported : {type: Boolean, default: false}
}, {timestamps: {createdAt: 'created_on', updatedAt: 'bumped_on'}})

const Reply = mongoose.model('Reply', replySchema)

const threadSchema = new mongoose.Schema({
  text: String,
  delete_password: String,
  reported : {type: Boolean, default: false},
  replies: {type: [replySchema], default : []}
}, {timestamps: {createdAt: 'created_on', updatedAt: 'bumped_on'}})

/* todo
threads.get (map thread and map replies )
remove password

*/


function replyMap(replies){
  return replies.map(({_id, text, created_on, bumped_on}) => ({_id, text, created_on, bumped_on}))
}
module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .get((req, res) => {
      let board = req.params.board
      let Thread = mongoose.model(board, threadSchema)

      Thread.find({}, {},{sort: {'bumped_on': -1}, limit: 10}, (err, data) => {
        return res.send(data.map(
          ({_id, text, created_on, bumped_on, replies}) => ({_id, text, created_on, bumped_on, replies: replyMap(replies).slice(-3), replycount: replies.length})
        ))
      })
    })
    .post((req, res) => {
      let board = req.params.board
      let Thread = mongoose.model(board, threadSchema)
      let {text, delete_password} = req.body
      if (!text || !delete_password){
        return res.send('Text or password not provided')
      }
      var thread = new Thread(req.body)
      thread.save((err, data) => {
        if (err) console.error(err)
        return res.redirect('/b/' + board + '/')
      })
    })
    .put((req, res) => {
      let board = req.params.board
      let Thread = mongoose.model(board, threadSchema)
      let {thread_id} = req.body
      Thread.findByIdAndUpdate(thread_id, {reported: true}, {new: true}, (err, data) => {
        if (!data) {
          return res.json('Thread not found')
        }
        return res.send('Thread Reported.')
      })
    })
    .delete((req, res) => {
      let board = req.params.board
      let Thread = mongoose.model(board, threadSchema)
      let {thread_id, delete_password} = req.body
      Thread.findById(thread_id, (err, data) => {
        if (!data){
          return res.send('Not found')
        }
        if (data.delete_password == delete_password){
          data.remove( (err, data) => {
            if (data) {
              res.send('Thread Deleted')
            }
          })
        } else{
          res.send('Incorrect Password')
        }
      })
    });
    
  app.route('/api/replies/:board')
    .get((req, res) => {
      let board = req.params.board
      let Thread = mongoose.model(board, threadSchema)
      let thread_id = req.query.thread_id
      Thread.findById(thread_id, (err, data) => {
        if (!data) {
          return res.send('No such thread.')
        }
        let {_id, text, created_on, bumped_on, replies} = data
        return res.send({_id, text, created_on, bumped_on, replies: replyMap(replies)})
      })
    })
    .post((req, res) => {
      let board = req.params.board
      let Thread = mongoose.model(board, threadSchema)
      let {text, delete_password, thread_id} = req.body
      const reply = new Reply({text, delete_password})
      Thread.findById(thread_id, (err, data) => {
        if (!data){
          return res.send('No such thread.')
        }
        data.replies.push(reply)
        data.save((err, updatedData) => {
          if (!updatedData) {
            return res.send('Error')
          }
          return res.send('Reply added.')
        })
      })
    })
    .put((req, res) => {
      let board = req.params.board
      let Thread = mongoose.model(board, threadSchema)
      let {thread_id, reply_id} = req.body
      Thread.findById(thread_id, (err, data) => {
        if (!data) {
          return res.send('No such Thread')
        }
        let reply =  data.replies.id(reply_id)
        if (!reply){
          return res.send('No such reply')
        }
        reply.reported = true
        data.save((err, updatedData) => {
        })
        res.send('Reply reported')
      })
    })
    .delete((req, res) => {
      let board = req.params.board
      let Thread = mongoose.model(board, threadSchema)
      let {thread_id, reply_id, delete_password} = req.body
      Thread.findById(thread_id, (err, data) => {
        if (!data) {
          return res.send('No such Thread')
        }
        let reply =  data.replies.id(reply_id)
        if (!reply){
          return res.send('No such reply')
        }
        if (reply.delete_password == delete_password){
          reply.text = '[deleted]' // here callback is not required. Since it is inside the array.
        } else{
          return res.send('Incorrect Password')
        }
        data.save((err, updatedData) => {
        })
        res.send('Reply Deleted.')
      })
    });

};
