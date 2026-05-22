// App.jsx
import React, { useEffect, useState } from 'react';

import { Tracker } from "meteor/tracker";
import { Tasks } from '../api/tasks';
import { Meteor } from 'meteor/meteor';
import { useTracker, useSubscribe } from "meteor/react-meteor-data";
import { isSyncing } from 'meteor/jam:offline';


Tracker.autorun(() => {

  const userId = Meteor.userId();
  const loggingIn = Meteor.loggingIn();
  console.log('userID', userId)
  console.log('loggingIn', loggingIn)
  const data = Tasks.find({}).fetch();
  console.log('Meteor front -Tracker : use Collection updated, current count of Tasks:', data.length);

});




export const App = () => {

  const { connected, status } = useTracker(() => Meteor.status());
  useEffect(() => {
    console.log('connected changed', connected)
  }, [connected])
  useEffect(() => {
    console.log('status changed', status)
  }, [status])


  const { tasks, isLoading } = useTracker(() => {
    const handle = Meteor.subscribe('tasks');
    return {
      isLoading: !handle.ready(),
      tasks: Tasks.find({}).fetch(),
    };
  }, []);


  const [hasSettled, setHasSettled] = useState(false);


  const { userId, loggingIn, data } = useTracker(() => {
    return {
      userId: Meteor.userId(),
      loggingIn: Meteor.loggingIn(),
      data: Tasks.find({}).fetch(),
    };
  });


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


  useEffect(() => {
    // Stop if we are still logging in, or if Minimongo hasn't settled its data load
    if (loggingIn || !hasSettled) return;

    console.log('userID', userId);
    console.log('Meteor front - Data settled. Current count of Tasks:', data.length);

    const iframe = document.getElementById("dse-front")
    if (iframe && iframe.contentWindow) {
      let payload=JSON.stringify({
          type: 'refresh',
          path: 'http://abc:404/api/get-all',
          httpType: 'GET',
          data: data
        })
      console.log("🟥Meteor front: postmessage refresh [sending data to pwa]",payload);
      iframe.contentWindow.postMessage(
        payload,
        '*'
      );
    }
  }, [data, userId, loggingIn, hasSettled]);




  const syncing = useTracker(() => isSyncing(), []);
  return (
    <div >
      <div>
        {(syncing||!hasSettled) && (
          <div className={`sync-overlay`}>
            <div className={`sync-content`}>
              <p className="sync-spinner">🔄</p>
              <p>Syncing changes made while offline...</p>
            </div>
          </div>
        )}

      </div>
      <div>
        {/* {queueCount > 0 ? (
        <div className="sync-status">🔄 Syncing {queueCount} pending tasks...</div>
      ) : ( */}
        <div className="online-status">Meteor.status().connected:<span className='online-status-indicator'> {connected ? '✅ Online' : '❌Offline'}</span></div>
        {/* )} */}
      </div>
      <div style={{
        display: "flex", flexDirection: "column"

      }} >
        {/* http://10.0.2.2:3010 http://localhost:3010*/}
        <div style={{ width: "100%", height: 1000 }}>
          <iframe id="dse-front" src="http://localhost:3010" style={{ width: "100%", height: 1000 }} onError={(e) => { console.log("iframe error", e) }} ></iframe>
        </div>
        <div className='border border-red-300' style={{ width: "100%", height: 1000, border: '1px solid green', border: '12px solid black', backgroundColor: '#bbbbbbff', padding: '2px', margin: '4px' }}>

          <div style={{ display: "flex", flexDirection: "column" }}>



          </div>
          <section style={{ width: "100%"}} id='minimongo-section'>
            <h2>List of records in minimongoo</h2>

            <ul style={{ fontSize: '5px', padding: 0, marginTop: 20 }}>
              {tasks.map((task) => (

                <li key={task._id + Math.random()} className='list-item'>
                  <p className='item-id'>{task.cnt}</p>
                  <div style={{ width: "10px" }}>
                    {task.text}</div>

 
                </li>
              ))}

            </ul>
          </section>

          <div>
          
          </div>

        </div>

      </div>
    </div>
  );
};