// App.jsx
import React, { useEffect, useState } from 'react';

import { Tracker } from "meteor/tracker";
import { Tasks } from '../api/tasks';
import { Meteor } from 'meteor/meteor';
// import { Tracker } from 'meteor/tracker';
import { useTracker, useSubscribe } from "meteor/react-meteor-data";
import { isSyncing } from 'meteor/jam:offline';
import { queueMethod } from 'meteor/jam:offline';
import { ListenerMessage, ActionList } from './shareStates'
import { Offline } from 'meteor/jam:offline';

Tracker.autorun(() => {
  
const userId = Meteor.userId();
  const loggingIn = Meteor.loggingIn();
  console.log('userID',userId)
  console.log('loggingIn', loggingIn)


  const data = Tasks.find({}).fetch();
  console.log('Meteor front -Tracker : use Collection updated, current count of Tasks:', data.length);

  // const isIframe = window.parent !== window;
  // if (isIframe) {
  //   console.log('Sending refresh to parent...');
  //   // Use the actual reference to the top-most window
  //   window.parent.postMessage({ 
  //     type: 'refresh', 
  //     data: data
  //   }, "*"); 
  // }

  let iframe = document.getElementById("dse-front");
  if (iframe) {
    // Post message to iframe
    console.log("Meteor front: postmessage refresh");
    iframe?.contentWindow?.postMessage(
      JSON.stringify({
        type: 'refresh',
        // collection:'tasks',
        path: 'http://abc:404/api/get-all',
        httpType: 'GET',
        data: data
      })
      , '*');
  }
});



const OfflineQueue = Mongo.Collection.get('jam_offline_methods');
export const App = () => {
  // const [tasks, setTasks] = useState([]);

  // const { queueCount, isConnected } = useTracker(() => {
  //   const isDDPConnected = Meteor.status().connected;
  //   const isBrowserOnline = navigator.onLine;
  //   console.log('isDDP',isDDPConnected)
  //   console.log('isBrowser', navigator.onLine)
  //   return {
  //     // Use optional chaining just in case it's not initialized yet
  //     queueCount: OfflineQueue?.find().count() || 0,
  //     isConnected: isDDPConnected && isBrowserOnline,
  //   };
  // }, []);

  const { connected, status } = useTracker(() => Meteor.status());
  useEffect(()=>{
    console.log('connected changed', connected  )
  },[connected])
  useEffect(()=>{
    console.log('status changed', status)
  },[status])
  // Your logic to react when the app comes back online
  // useEffect(() => {
  //   if (isConnected && queueCount > 0) {
  //     console.log(`Syncing ${queueCount} items to the server...`);
  //   }
  // }, [isConnected, queueCount]);


  const [inputboxTaskText, setInputboxTaskText] = useState('');
  const [currentTaskCntId, setCurrentTaskCntId] = useState('');
  // Replace your isolated useSubscribe and useTracker lines with this:
const { tasks, isLoading } = useTracker(() => {
  const handle = Meteor.subscribe('tasks');
  return {
    isLoading: !handle.ready(),
    tasks: Tasks.find({}).fetch(),
  };
}, []);



const [hasSettled, setHasSettled] = useState(false);

  // 1. Grab your data reactively
  const { userId, loggingIn, data } = useTracker(() => {
    return {
      userId: Meteor.userId(),
      loggingIn: Meteor.loggingIn(),
      data: Tasks.find({}).fetch(),
    };
  });

  // 2. Wait for Minimongo to populate from IndexedDB
  useEffect(() => {
    if (data.length > 0) {
      setHasSettled(true);
    } else {
      // If the database is completely empty naturally, give IndexedDB 
      // 300ms to safely confirm there are 0 items before giving up.
      const timer = setTimeout(() => setHasSettled(true), 300);
      return () => clearTimeout(timer);
    }
  }, [data.length]);

  // 3. Handle your iframe postMessage side-effects
  useEffect(() => {
    // Stop if we are still logging in, or if Minimongo hasn't settled its data load
    if (loggingIn || !hasSettled) return;

    console.log('userID', userId);
    console.log('Meteor front - Data settled. Current count of Tasks:', data.length);

    const iframe = document.getElementById("dse-front") 
    if (iframe && iframe.contentWindow) {
      console.log("Meteor front: postmessage refresh sending data...");
      iframe.contentWindow.postMessage(
        JSON.stringify({
          type: 'refresh',
          path: 'http://abc:404/api/get-all',
          httpType: 'GET',
          data: data
        }), 
        '*'
      );
    }
  }, [data, userId, loggingIn, hasSettled]);


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
const syncing = useTracker(() => isSyncing(), []);
  return (
    <div >
      <div>
  {syncing && (
    <div className="sync-overlay">
      <div className="sync-content">
        <p className="sync-spinner">🔄</p>
        <p>Syncing changes made while offline...</p>
      </div>
    </div>
  )}

  {!syncing && (
    <p className="sync-success">
      ✅ All offline actions have been executed and synced!
    </p>
  )}
</div>
      <div>
      {/* {queueCount > 0 ? (
        <div className="sync-status">🔄 Syncing {queueCount} pending tasks...</div>
      ) : ( */}
        <div className="online-status">{connected ? '✅ Online!' : 'Offline!'}</div>
      {/* )} */}
    </div>
      <div style={{
        display: "flex", flexDirection: "column"

      }} >        
      {/* http://10.0.2.2:3010 http://localhost:3010*/}
      <div style={{ width: "100%", height: 1000 }}>   
          <iframe id="dse-front" src="http://localhost:3010" style={{ width: "100%", height: 1000 }} onError={(e) => { console.log("iframe error", e) }} ></iframe>
        </div>
        <div  className='border border-red-300' style={{ width: "100%", height: 1000, border: '1px solid green', backgroundColor: 'gray', padding: '2px' }}>
      
          <div style={{ display: "flex", flexDirection: "column" }}>



          </div>
          <section style={{ width: "100%", border: '5px solid #00648bff' }} id='minimongo-section'>
            <h2>List of records in minimongo</h2>
            {/* <input
              type="text"
              style={{ width: "10px"}}
              value={inputboxTaskText}
              onChange={(e) => setInputboxTaskText(e.target.value)}
              disabled
            /> */}
            {/* <button onClick={currentTaskCntId ? () => handleUpdateTask(currentTaskCntId, inputboxTaskText) : handleAddTask} disabled>
              {currentTaskCntId ? 'Update Task' : 'Add Task'}
            </button> */}

            <ul style={{ fontSize: '5px', padding: 0, marginTop: 20 }}>
              {tasks.map((task) => (

                <li key={task._id + Math.random()} className='list-item'>
                  <p className='item-id'>{task.cnt}</p>
                  <div   style={{ width: "10px"}}>
                    {task.text}</div>

                  <div>
                    {/* <button onClick={() => handleTaskEdit(task)} disabled>Edit</button>
                    <button onClick={() => handleDeleteTask(task.cnt)} disabled>Delete</button> */}

                  </div>
                </li>
              ))}

            </ul>
          </section>

          <div>
            {/* <button onClick={() => test()} >Test Button </button> */}
          </div>

        </div>

      </div>
    </div>
  );
};