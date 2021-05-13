const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let threadText = 'Chai Thread for testing';
let threadDeletePassword = 'Cha1';
var thread_id;
var reply_id;


suite('Functional Tests', function() {

    test('Creating a new thread: POST request to /api/threads/{board}', (done) => {
        chai.request(server)
            .post('/api/threads/chaitest')
            .send({text: threadText, delete_password: threadDeletePassword })
            .end((err, res) => {
                assert.equal(res.status, 200)
                done()
            })
    })

    test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', (done) => {
        chai.request(server)
            .get('/api/threads/chaitest')
            .end((err, res) => {
                assert.isArray(res.body)
                thread_id = res.body[0]._id
                done()
            })
    })

    test('Reporting a thread: PUT request to /api/threads/{board}', (done) => {
        chai.request(server)
            .put('/api/threads/chaitest')
            .send({thread_id })
            .end((err, res) => {
                assert.equal(res.text, 'Thread Reported.' )
                done()
            })
    })

    test('Creating a new reply: POST request to /api/replies/{board}', (done) => {
        chai.request(server)
            .post('/api/replies/chaitest')
            .send({text: 'some random stuff', delete_password: 'reply', thread_id})
            .end((err, res) => {
                assert.equal(res.text, 'Reply added.')
                done()
            })
    })

    test('Viewing a single thread with all replies: GET request to /api/replies/{board}', (done) => {
        chai.request(server)
            .get('/api/replies/chaitest?thread_id=' + thread_id)
            .end((err, res) => {
                
                assert.equal(res.body._id, thread_id)
                assert.isArray(res.body.replies)
                reply_id = res.body.replies[0]._id
                done()
            })
    })


    test('Reporting a reply: PUT request to /api/replies/{board}', (done) => {
        chai.request(server)
            .put('/api/replies/chaitest')
            .send({thread_id, reply_id })
            .end((err, res ) => {
                assert.equal(res.text, 'Reply reported')
                done()
            })

    })

    test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password', (done) => {
        chai.request(server)
            .delete('/api/replies/chaitest')
            .send({thread_id, delete_password: 'wrong', reply_id})
            .end((err, res) => {
                assert.equal(res.text, 'Incorrect Password')
                done()
            })
    })

    

    test('Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password', (done) => {
        chai.request(server)
            .delete('/api/replies/chaitest')
            .send({thread_id, delete_password: 'reply', reply_id})
            .end((err, res) => {
                assert.equal(res.text, 'Reply Deleted.')
                done()
            })
    })

    test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', (done) => {
        chai.request(server)
            .delete('/api/threads/chaitest')
            .send({thread_id, delete_password: 'wrong'})
            .end((err, res) => {
                assert.equal(res.text, 'Incorrect Password')
                done()
            })
    })

    

    test('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with an valid delete_password', (done) => {
        chai.request(server)
            .delete('/api/threads/chaitest')
            .send({thread_id, delete_password: threadDeletePassword})
            .end((err, res) => {
                assert.equal(res.text, 'Thread Deleted')
                done()
            })
    })


});
