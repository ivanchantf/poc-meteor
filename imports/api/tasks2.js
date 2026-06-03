// /imports/api/tasks.js
import { Mongo } from 'meteor/mongo';
import { Meteor } from "meteor/meteor";
import { MongoInternals } from 'meteor/mongo';
import './offline';
export const Tasks2 = new Mongo.Collection('tasks2');
// Explicitly tell jam:offline to track this collection
Tasks2.keep()
Meteor.methods({
    async 'tasks2.insert'(data) {
        if (!data ) {
            throw new Meteor.Error('Task data is required');
        }
        const taskId = await Tasks2.insertAsync({ ...data });//, _id:uid
        return taskId ;// CRITICAL FOR jam:offline:  must return the ID
    },
    async 'tasks2.update'(data) {
        if (!data._id || !data) {
            throw new Meteor.Error('Task _id and  data are required');
        }
        await Tasks2.updateAsync({ _id: data._id },data)
        return data._id; // Return the ID of the updated task
    },
    async 'tasks2.remove'(id) {
        if (!id) {
            throw new Meteor.Error('Task id is required');
        }
        await Tasks2.removeAsync({ _id: id });
            return id;// CRITICAL FOR jam:offline: Returning the id cleanly registers deletion sync completion
    },

    async 'tasks2.read'() {
        return Tasks2.find({}).fetch();
    }
});
