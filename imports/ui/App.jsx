// App.jsx
import React, { useEffect, useState } from 'react';

import { Tracker } from "meteor/tracker";
import { Tasks } from '../api/tasks';
import { Meteor } from 'meteor/meteor';
// import { Tracker } from 'meteor/tracker';
import { useTracker, useSubscribe } from "meteor/react-meteor-data";
import { isSyncing } from 'meteor/jam:offline';
import { queueMethod } from 'meteor/jam:offline';


// Tracker.autorun(function (computation) {
//   // Meteor.subscribe('tasks');
//   // Get the cursor for the collection
//   const cursor = Tasks.find({});

//   console.log('changed cursor')
//   console.log(cursor)
//   // Observe changes to the cursor

//   const handle = cursor.observeChanges({
//     // added: function (id, fields) {
//     //   console.log('Document added:', id, fields);
//     //   // Run your custom logic here
//     // },
//     changed: function (id, fields) {
//       console.log('Document changed:', id, fields);
//       console.log('Sending liRecords from meteor to pwa')
//       console.log(window.parent.parent.location !== window.location )
//       console.log(window.parent.parent.location)
//       console.log(window.location)
//       if(window.parent.parent.location !== window.location){
//           console.log('Sending liRecords from meteor to pwa')
//          window.parent.parent.postMessage(JSON.stringify({ 'type': 'refresh', 'data': cursor.fetch()}), "*");
//       }
   
//     },
//     removed: function (id) {
//       console.log('Document removed:', id);
//       console.log('Sending liRecords from meteor to pwa')
//       if(window.parent.parent.location !== window.location){
//          window.parent.parent.postMessage(JSON.stringify({ 'type': 'refresh', 'data':cursor.fetch() }), "*");
//       }
//     }
//   });
// // Stop the observer when the computation invalidates/re-runs
//   computation.onInvalidate(() => {
//     handle.stop();
//   });

// })
Tracker.autorun(() => {
  const data = Tasks.find({}).fetch();
  console.log('Collection updated, current count of Tasks:', data.length);

  // const isIframe = window.parent !== window;
  // if (isIframe) {
  //   console.log('Sending refresh to parent...');
  //   // Use the actual reference to the top-most window
  //   window.parent.postMessage({ 
  //     type: 'refresh', 
  //     data: data
  //   }, "*"); 
  // }

  let iframe=document.getElementById("dse-front");
  if (iframe) {
			// Post message to iframe
			console.log("postmessage refresh");
			iframe?.contentWindow?.postMessage(
				JSON.stringify({
					type: 'refresh',
					// collection:'tasks',
					path:'http://abc:404/api/get-all',
					httpType:'GET',
					data: data
				})
			,'*');
		}
});

export const App = () => {
  // const [tasks, setTasks] = useState([]);
  const [inputboxTaskText, setInputboxTaskText] = useState('');
  const [currentTaskCntId, setCurrentTaskCntId] = useState('');
  const isLoading = useSubscribe("tasks");

  useEffect( ()=>{
     console.log('Entering fetch Data')
    let fetchData=async()=>{
      console.log('fetching data')
        let read = await Meteor.callAsync('tasks.read');
        console.log('remoteR')
        console.log(read)
        
        // if (!Meteor.status().connected) { // check that the user is offline
        //     console.log('=========METE-FRONT:OFFLINE NOW,will queue taskRemote.read')
        //     queueMethod('tasksRemote.read') // the arguments should be the same form that you'd use for Meteor.callAsync
        // }
        // else{
            // console.log('=========METE-FRONT:ONLINE NOW, will call taskRemote.read')
            let remoteRead = await Meteor.callAsync('tasksRemote.read');
        //     console.log('remoteR')
        //     console.log(remoteRead)
        // }
    };
    //  fetchData()

  },[])
  let tasks=useTracker(()=>{return Tasks.find({}).fetch()})






  const generateUniqueId = () => {
    let generateRandomString = (length) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return `${new Date().getTime()}-${result}`;
    }
    return `${new Date().getTime()}_${generateRandomString(10)}`;
  }

  const handleAddTask = async () => {
    if (inputboxTaskText) {
      let uid = generateUniqueId()
      Meteor.callAsync('tasks.insert', inputboxTaskText, uid);

      
      // if (!Meteor.status().connected) {
      //   console.log('=========METE-FRONT:handleAddTask: OFFLINE NOW,will do insert when go back online')
      //   queueMethod('tasksRemote.insert', inputboxTaskText, uid)
      // }
      // else {
      //   console.log('=========METE-FRONT:handleAddTask: ONLINE NOW, will do insert to remote now')
        Meteor.callAsync('tasksRemote.insert', inputboxTaskText, uid);
      // }
      setInputboxTaskText('')
    }
  };

  const handleUpdateTask = (cntId, text) => {
    if (text) {
      console.log('cntId', cntId)
      Meteor.callAsync('tasks.update', cntId, text);


      // if (!Meteor.status().connected) {
      //   console.log('=========METE-FRONT:OFFLINE NOW,will do taskRemote.update')
      //   queueMethod('tasksRemote.update', cntId, text)
      // }
      // else {
      //   console.log('=========METE-FRONT:ONLINE NOW, will do taskRemote.update')
        Meteor.callAsync('tasksRemote.update', cntId, text);
      // }
      setCurrentTaskCntId('');
      setInputboxTaskText('')
    }
  };

  const handleDeleteTask = (cntId) => {
    console.log('handleDeleteTask-Deleting ', cntId)
    Meteor.callAsync('tasks.remove', cntId);
    
    // if (!Meteor.status().connected) {
    //   console.log('=========METE-FRONT:OFFLINE NOW,will do taskRemote.remove')
    //   queueMethod('tasksRemote.remove', cntId)
    // }
    // else {
    //   console.log('=========METE-FRONT:ONLINE NOW, will do taskRemote.remove')
      Meteor.callAsync('tasksRemote.remove', cntId);
    // }

  };



  const handleTaskEdit = (task) => {
    setCurrentTaskCntId(task.cnt);
    setInputboxTaskText(task.text);
  };



  // if (isLoading()) {
  //   return <div>Loading...</div>;
  // }



  const test = async () => {
    console.log('test button triggered')

    let a = await Tasks.find().fetch()
    console.log(a)
  }
//   if (isLoading()) {
//   return <div>Loading...</div>; // Avoid rendering until subscription is ready
// }

  // if(isSyncing()){
  //   return(<p className='notice'>isSyncingDetail</p>)
  // }

  return (
    <div style={{display:"flex",flexDirection:"row"}} >
      <div className='border border-red-300' style={{width:"50%",height:1000}}>

      <div><button onClick={() => test() } disabled>Test Button </button></div><hr></hr>
      <h2>Task List</h2>
      <input
        type="text"
        value={inputboxTaskText}
        onChange={(e) => setInputboxTaskText(e.target.value)}
        disabled
      />
      <button onClick={currentTaskCntId ? () => handleUpdateTask(currentTaskCntId, inputboxTaskText) : handleAddTask} disabled>
        {currentTaskCntId ? 'Update Task' : 'Add Task'}
      </button>

      <ul>
        {tasks.map((task) => (

          <li key={task._id+Math.random()} className='list-item'>
            <p className='item-id'>{task.cnt}</p>
            <div>
              {task.text}</div>

            <div>
              <button onClick={() => handleTaskEdit(task)} disabled>Edit</button>
              <button onClick={() => handleDeleteTask(task.cnt)} >Delete</button>

            </div>
          </li>
        ))}
     
      </ul>
        </div>
        <div style={{width:"50%",height:1000}}>
      			<iframe  id="dse-front" src="http://localhost:3010" style={{width:"100%",height:1000}}  onError={(e)=>{console.log("iframe error",e)}} ></iframe>
        </div>
    </div>
  );
};