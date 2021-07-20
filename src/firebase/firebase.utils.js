import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

const firebaseConfig = {
  apiKey: "AIzaSyCHAllXm9uaufWa4JBdr3dwV9qfmE2rSyI",
  authDomain: "onid-tm.firebaseapp.com",
  projectId: "onid-tm",
  storageBucket: "onid-tm.appspot.com",
  messagingSenderId: "141658461672",
  appId: "1:141658461672:web:47706ce9c15eb178dd805d",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

var provider = new firebase.auth.GoogleAuthProvider();
const auth = firebase.auth();
export const timestamp = firebase.firestore.Timestamp;
export const fieldValue = firebase.firestore.FieldValue;

/* auth
  .createUserWithEmailAndPassword("buko@onid.com", "111111")
  .then((regUser) => {
    console.log(regUser.user);
    db.collection("users").doc(regUser.user.uid).set(
      {
        userName: this.state.userName,
        uid: regUser.user.uid,
        email: this.state.email,
        assignedTasks: [],
        favoriteStations: [],
        imageUrl:
          "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/a5900ce8-b6a5-4575-a9c3-dfcaab76d1eb/d4n7jp8-32d848b5-f48c-46ec-acfb-c72595e173b5.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcL2E1OTAwY2U4LWI2YTUtNDU3NS1hOWMzLWRmY2FhYjc2ZDFlYlwvZDRuN2pwOC0zMmQ4NDhiNS1mNDhjLTQ2ZWMtYWNmYi1jNzI1OTVlMTczYjUuZ2lmIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.1TpIeeQ6fo6etC8CKLgIBrjEIiWXz37b81lKZcmiA9c",
      },
      { merge: true }
    );
  })
  .catch((error) => {
    console.log(error.message);
  });
 */
/* const demoUser = async () => {
  const userRef = await db.collection("users").doc("buko").get();
  if (userRef.exists) {
    return;
  } else {
    let userData = {
      email: "buko@onid.app",
      image:
        "https://i.pinimg.com/originals/61/88/7c/61887ce0f50a0e04475d62039944415c.jpg",
      uid: "bukYVVqVPcuGdSRMoDuxSTGEUU2Ggp2o",
      userName: "buko",
    };
    createUserInFirebase(userData);
  }
};
demoUser(); */

const LoginWithGoogle = () => {
  auth.signInWithPopup(provider).catch((error) => {
    console.log(error.message);
  });
};

const loginWithEmailAndPassword = (email, password) => {
  auth.signInWithEmailAndPassword(email, password).catch((error) => {
    var errorMessage = error.message;
    console.log(errorMessage);
  });
};

export const registerUserFb = async (user, userName) => {
  console.log(userName);
  const { uid, email, photoURL } = user;
  const userRef = await db.collection("users").doc(uid).get();
  if (!userRef.exists) {
    await db.collection("users").doc(uid).set({
      userName: userName,
      uid: uid,
      email: email,
      assignedTasks: [],
      favoriteStations: [],
      imageUrl: photoURL,
    });
    const userImage = await db.collection("users").doc(uid).get();
    const userImageUrl = userImage.data().imageUrl;
    if (userImageUrl === null) {
      db.collection("users").doc(uid).set(
        {
          imageUrl:
            "https://i.pinimg.com/originals/30/b0/d5/30b0d5530cd5accbba769802de6cb9af.jpg",
        },
        { merge: true }
      );
    }
  } else {
    console.log("no code");
  }
};

const createNewSpace = async (name, currentUser, color, setLayer) => {
  const { uid } = currentUser;
  if (!name) {
    alert("Space name is req");
    return;
  }

  await db
    .collection("space")
    .add({
      name: name,
      admin: uid,
      color: color,
      members: firebase.firestore.FieldValue.arrayUnion(uid),
      created: new Date(),
      description: "Add description",
    })
    .then((data) => {
      let id = data.id;
      db.collection("space").doc(id).set(
        {
          spaceId: id,
        },
        { merge: true }
      );
    });

  if (setLayer) {
    setLayer(false);
  }
};

export const createNewStation2 = (
  spaceId,
  stationName,
  statusType,
  statusOrder,
  modules
) => {
  const stationsRef = db
    .collection("space")
    .doc(spaceId)
    .collection("stations");

  stationsRef
    .add({
      name: stationName,
      description: "Add description",
      fromSpaceId: spaceId,
      open: true,
    })
    .then((data) => {
      let id = data.id;
      stationsRef.doc(id).set(
        {
          stationId: id,
        },
        { merge: true }
      );
      stationsRef.doc(id).collection("tasks").doc("tasks").set({
        tasks: null,
        statusType,
        statusOrder,
      });
      stationsRef.doc(id).collection("modules").doc("modules").set({
        modules,
      });
    });
};

export const createNewTask = async (
  spaceId,
  stationId,
  statusName,
  newTaskName,
  userId
) => {
  const docRef = db
    .collection("space")
    .doc(spaceId)
    .collection("stations")
    .doc(stationId)
    .collection("tasks")
    .doc("tasks");
  const getData = await docRef.get();
  const data = getData.data();
  const { statusType, tasks } = data;

  // TASKS
  let v4 = uuidv4();
  let newTask = {
    [v4]: {
      id: v4,
      content: newTaskName,
      createdBy: userId,
      assign: null,
      created: new Date(),
      deadline: null,
      fromSpaceId: spaceId,
      fromStationId: stationId,
      message: [],
      priority: [
        { name: "Urgent", active: false, color: "rgb(226, 68, 92)" },
        { name: "High", active: false, color: "rgb(253, 171, 61)" },
        { name: "Nomal", active: true, color: "rgb(52, 181, 228)" },
        { name: "Low", active: false, color: "rgb(5, 206, 145)" },
      ],
    },
  };
  let newTasks = {
    ...tasks,
    ...newTask,
  };

  // STATUS TYPE

  let taskIds = statusType[statusName].taskIds;

  taskIds.push(v4);

  const newData = {
    ...data,
    statusType: {
      ...statusType,
      [statusName]: {
        ...data.statusType[statusName],
        taskIds: taskIds,
      },
    },
    tasks: newTasks,
  };
  docRef.set({
    ...newData,
  });
};

export const updateDrag = (spaceId, stationId, newState) => {
  console.log("updateing");
  db.collection("space")
    .doc(spaceId)
    .collection("stations")
    .doc(stationId)
    .collection("tasks")
    .doc("tasks")
    .set({
      ...newState,
    });
};

export const removeMember = (spaceId, memberId) => {
  console.log(spaceId, memberId);
  db.collection("space")
    .doc(spaceId)
    .update({
      members: firebase.firestore.FieldValue.arrayRemove(memberId),
    });
};

export const newAdmin = (spaceId, memberId) => {
  db.collection("space").doc(spaceId).update({
    admin: memberId,
  });
};

export const setSpaceAsFavorite = (userId, spaceId) => {
  db.collection("users").doc(userId).update({
    favoriteSpace: spaceId,
  });
};

export const getFavoriteStations = async (favoriteSpaceId) => {
  if (!favoriteSpaceId) return;
  const colRef = db
    .collection("space")
    .doc(favoriteSpaceId)
    .collection("stations");
  const querySnapshop = await colRef.get();
  if (querySnapshop.empty) {
    console.log("empity");

    let list = [];
    querySnapshop.forEach((data) => {
      list.push(data.data());
    });
    return list;
  }
};

export const renameStation = (spaceId, stationId, newName) => {
  db.collection("space")
    .doc(spaceId)
    .collection("stations")
    .doc(stationId)
    .update({
      name: newName,
    });
};

export const renameSpace = (spaceId, newName) => {
  db.collection("space").doc(spaceId).update({
    name: newName,
  });
};

export const deleteSpace = (spaceId) => {
  db.collection("space")
    .doc(spaceId)
    .collection("stations")
    .get()
    .then((stationQuery) => {
      if (!stationQuery.empty) {
        stationQuery.forEach((stationDoc) => {
          db.collection("space")
            .doc(spaceId)
            .collection("stations")
            .doc(stationDoc.id)
            .collection("tasks")
            .doc("tasks")
            .delete();
          db.collection("space")
            .doc(spaceId)
            .collection("stations")
            .doc(stationDoc.id)
            .collection("modules")
            .doc("modules")
            .delete();
          stationDoc.ref.delete();
        });
      }
    })
    .then(() => {
      db.collection("space").doc(spaceId).delete();
    });
};

export const deleteStation = async (spaceId, stationId) => {
  await db
    .collection("space")
    .doc(spaceId)
    .collection("stations")
    .doc(stationId)
    .collection("modules")
    .doc("modules")
    .delete();

  await db
    .collection("space")
    .doc(spaceId)
    .collection("stations")
    .doc(stationId)
    .collection("tasks")
    .doc("tasks")
    .collection("msg")
    .get()
    .then((query) => {
      query.forEach((msgDoc) => {
        db.collection("space")
          .doc(spaceId)
          .collection("stations")
          .doc(stationId)
          .collection("tasks")
          .doc("tasks")
          .collection("msg")
          .doc(msgDoc.id)
          .delete();
      });
    })
    .then(() => {
      db.collection("space")
        .doc(spaceId)
        .collection("stations")
        .doc(stationId)
        .collection("tasks")
        .doc("tasks")
        .delete();

      db.collection("space")
        .doc(spaceId)
        .collection("stations")
        .doc(stationId)
        .delete();
    });
};

export const updateColorOfSpace = (spaceId, color) => {
  db.collection("space").doc(spaceId).update({
    color: color,
  });
};

export const changeDescriptionOfSpace = (spaceId, newDesc) => {
  db.collection("space").doc(spaceId).update({
    description: newDesc,
  });
};

export const changeDescriptionOfStation = (spaceId, stationId, newDesc) => {
  db.collection("space")
    .doc(spaceId)
    .collection("stations")
    .doc(stationId)
    .update({
      description: newDesc,
    });
};
export const changeNameOfStation = (spaceId, stationId, newName) => {
  console.log(spaceId, stationId, newName);
  db.collection("space")
    .doc(spaceId)
    .collection("stations")
    .doc(stationId)
    .update({
      name: newName,
    });
};

export const changeTaskName = async (spaceId, stationId, newName, taskId) => {
  let allTasks = [];
  let task = [];

  const tasksRef = db
    .collection("space")
    .doc(spaceId)
    .collection("stations")
    .doc(stationId)
    .collection("tasks")
    .doc("tasks");

  tasksRef
    .get()
    .then((taskData) => {
      allTasks = taskData.data().tasks;
      task = taskData.data().tasks[taskId];
      task = {
        ...task,
        content: newName,
      };
    })
    .then(() => {
      tasksRef.set(
        {
          tasks: {
            ...allTasks,
            [taskId]: {
              ...task,
            },
          },
        },
        { merge: true }
      );
    });
};

export const updateModulesDb = (spaceId, stationId, module, modules) => {
  let objIndex = modules.findIndex((item) => item.name === module.name);
  modules[objIndex].active = !modules[objIndex].active;
  db.collection("space")
    .doc(spaceId)
    .collection("stations")
    .doc(stationId)
    .collection("modules")
    .doc("modules")
    .set({
      modules,
    });
};

export const getUserDataWithId = async (userId) => {
  console.log(userId);
  const userRef = db.collection("users").doc(userId);
  const userData = await userRef.get();
  const data = userData.data();
  return data;
};

export const assignMember = (spaceId, stationId, taskId, userId) => {
  let allTasks = [];
  let task = [];

  const tasksRef = db
    .collection("space")
    .doc(spaceId)
    .collection("stations")
    .doc(stationId)
    .collection("tasks")
    .doc("tasks");

  tasksRef
    .get()
    .then((taskData) => {
      allTasks = taskData.data().tasks;
      task = taskData.data().tasks[taskId];
      task = {
        ...task,
        assign: userId,
      };
    })
    .then(() => {
      tasksRef.set(
        {
          tasks: {
            ...allTasks,
            [taskId]: {
              ...task,
            },
          },
        },
        { merge: true }
      );
    });
};

export const unAssign = (spaceId, stationId, taskId) => {
  let task = {};
  let tasks = {};
  const tasksRef = db
    .collection("space")
    .doc(spaceId)
    .collection("stations")
    .doc(stationId)
    .collection("tasks")
    .doc("tasks");

  tasksRef
    .get()
    .then((taskData) => {
      task = taskData.data().tasks[taskId];
      tasks = taskData.data().tasks;
      console.log(taskData.data());
      tasks = {
        ...tasks,
        [taskId]: {
          ...task,
          assign: [],
        },
      };
    })
    .then(() => {
      console.log(tasks);
      tasksRef.update({
        tasks: {
          ...tasks,
        },
      });
    });
};

export const setPriority = (
  spaceId,
  stationId,
  taskId,
  allPriority,
  priority
) => {
  let allTasks = [];
  let task = [];

  // set all false
  allPriority.map((item) => (item.active = false));

  // set active on clicked element
  priority.active = true;

  const tasksRef = db
    .collection("space")
    .doc(spaceId)
    .collection("stations")
    .doc(stationId)
    .collection("tasks")
    .doc("tasks");

  tasksRef
    .get()
    .then((taskData) => {
      allTasks = taskData.data().tasks;
      task = taskData.data().tasks[taskId];
      task = {
        ...task,
        priority: [...allPriority],
      };
    })
    .then(() => {
      tasksRef.set(
        {
          tasks: {
            ...allTasks,
            [taskId]: {
              ...task,
            },
          },
        },
        { merge: true }
      );
    });
};

export const setStatus = (
  spaceId,
  stationId,
  currentStatusType,
  taskId,
  status,
  statusType
) => {
  let removedStatus = {};

  console.log(statusType);

  // remove taskId from current
  let removeCurrentId = currentStatusType.taskIds.filter((id) => id !== taskId);

  removedStatus = currentStatusType.taskIds = removeCurrentId;
  console.log(removedStatus[0]);

  // add taskId to new

  statusType[status.name] = {
    ...status,
    taskIds: [...status.taskIds, taskId],
  };

  console.log(statusType);

  // set taskIds

  const statusTypeRef = db
    .collection("space")
    .doc(spaceId)
    .collection("stations")
    .doc(stationId)
    .collection("tasks")
    .doc("tasks");

  statusTypeRef.set(
    {
      statusType: { ...statusType },
    },
    { merge: true }
  );
};

export const convertDate = (timestamp) => {
  if (!timestamp) {
    return;
  }

  let myTime = timestamp.toDate();
  let date = myTime.getDate();
  let month = myTime.getMonth();
  let year = myTime.getFullYear();
  return `${date}.${month + 1}`;
};

export const setDeadlineDate = (spaceId, stationId, date, taskId) => {
  let allTasks = [];
  let task = [];

  const tasksRef = db
    .collection("space")
    .doc(spaceId)
    .collection("stations")
    .doc(stationId)
    .collection("tasks")
    .doc("tasks");

  tasksRef
    .get()
    .then((taskData) => {
      allTasks = taskData.data().tasks;
      task = taskData.data().tasks[taskId];
      task = {
        ...task,
        deadline: date,
      };
    })
    .then(() => {
      tasksRef.set(
        {
          tasks: {
            ...allTasks,
            [taskId]: {
              ...task,
            },
          },
        },
        { merge: true }
      );
    });
};

export const changeStatusTypeName = (
  spaceId,
  stationId,
  statusName,
  newName,
  statusTypeCheck
) => {
  let keys = Object.keys(statusTypeCheck);
  if (statusName === newName) {
    alert("same name");
    return;
  }
  if (keys.includes(newName)) {
    alert("name allready takaen");
    return;
  }

  let statusOrder = [];
  let statusType = {};

  const tasksRef = db
    .collection("space")
    .doc(spaceId)
    .collection("stations")
    .doc(stationId)
    .collection("tasks")
    .doc("tasks");

  tasksRef
    .get()
    .then((taskData) => {
      statusOrder = taskData.data().statusOrder;
      let indexStatus = statusOrder.findIndex((item) => item === statusName);
      statusOrder[indexStatus] = newName;
      console.log(statusOrder);

      statusType = taskData.data().statusType;

      statusType = {
        ...statusType,
        [statusName]: {
          ...statusType[statusName],
          name: newName,
          id: newName,
        },
      };
      statusType[newName] = {
        ...statusType[statusName],
      };
      delete statusType[statusName];
    })
    .then(() => {
      tasksRef.update({
        statusOrder,
        statusType,
      });
    });
};

export const deleteStatusType = (spaceId, stationId, statusName) => {
  let statusOrder = [];
  let newOrder = [];
  let statusType = {};
  let tasks = {};

  const tasksRef = db
    .collection("space")
    .doc(spaceId)
    .collection("stations")
    .doc(stationId)
    .collection("tasks")
    .doc("tasks");

  tasksRef
    .get()
    .then((taskData) => {
      // get all data
      statusOrder = taskData.data().statusOrder;
      statusType = taskData.data().statusType;
      tasks = taskData.data().tasks;

      // set status order
      newOrder = statusOrder.filter((item) => item !== statusName);
      console.log(newOrder);

      // set status type
      delete statusType[statusName];
      console.log(statusType);
    })
    .then(() => {
      tasksRef.update({
        statusOrder: [...newOrder],
        statusType,
      });
    });
};

export const createNewStatus = (spaceId, stationId, newName) => {
  let statusOrder = [];
  let statusType = {};

  const tasksRef = db
    .collection("space")
    .doc(spaceId)
    .collection("stations")
    .doc(stationId)
    .collection("tasks")
    .doc("tasks");

  tasksRef
    .get()
    .then((taskData) => {
      // get all data
      statusOrder = taskData.data().statusOrder;
      statusType = taskData.data().statusType;

      // chekc conditions
      if (statusOrder.includes(newName)) {
        alert("name allready taken");
        return;
      }

      // set status order
      statusOrder.push(newName);

      // set status type
      statusType = {
        ...statusType,
        [newName]: {
          color: "#FDAB3D",
          id: newName,
          name: newName,
          taskIds: [],
          open: true,
        },
      };
      console.log(statusType);
    })
    .then(() => {
      tasksRef.update({
        statusOrder,
        statusType,
      });
    });
};

export const setTaskColor = (spaceId, stationId, statusName, newColor) => {
  console.log("setting new color", newColor);
  let statusType = {};

  const tasksRef = db
    .collection("space")
    .doc(spaceId)
    .collection("stations")
    .doc(stationId)
    .collection("tasks")
    .doc("tasks");

  tasksRef
    .get()
    .then((taskData) => {
      // get all data
      statusType = taskData.data().statusType;

      // set status type
      statusType = {
        ...statusType,
        [statusName]: {
          ...statusType[statusName],
          color: newColor,
        },
      };
      console.log(statusType);
    })
    .then(() => {
      tasksRef.update({
        statusType,
      });
    });
};

export const updateUser = (userId, user) => {
  const userRef = db.collection("users").doc(userId);
  userRef.update({
    ...user,
  });
};

export const getTaskData = (spaceId, stationId) => {
  return db
    .collection("space")
    .doc(spaceId)
    .collection("stations")
    .doc(stationId)
    .get()
    .then((data) => {
      return data.data();
    });
};

export const removeStarFavorite = (userId, stationId) => {
  db.collection("users")
    .doc(userId)
    .update({
      favoriteStations: firebase.firestore.FieldValue.arrayRemove(stationId),
    });
};
export const addStarFavorite = (userId, stationId) => {
  db.collection("users")
    .doc(userId)
    .update({
      favoriteStations: firebase.firestore.FieldValue.arrayUnion(stationId),
    });
};

/* export const unAssignFromAllTasks = (assignedArray, spaceId, userId) => {
  let mustRemoveTasks = assignedArray.filter(
    (item) => item.fromSpaceId === spaceId
  );
  console.log(mustRemoveTasks);
  mustRemoveTasks.map((task) => {
    let allTasks = {};
    const { fromSpaceId, fromStationId } = task;
    const tasksRef = db
      .collection("space")
      .doc(fromSpaceId)
      .collection("stations")
      .doc(fromStationId)
      .collection("tasks")
      .doc("tasks");

    tasksRef
      .get()
      .then((tasksData) => {
        allTasks = tasksData.data().tasks;
        allTasks[task.id].assign = [];
      })
      .then(() => {
        tasksRef.set(
          {
            tasks: {
              ...allTasks,
            },
          },
          { merge: true }
        );
      });
  });
}; */

export const createMessageToTask = (
  spaceId,
  stationId,
  newMessage,
  userId,
  taskId
) => {
  db.collection("space")
    .doc(spaceId)
    .collection("stations")
    .doc(stationId)
    .collection("tasks")
    .doc("tasks")
    .collection("msg")
    .add({
      message: newMessage,
      from: userId,
      created: new Date(),
      taskId: taskId,
    });
};

export const toggleStatus = (spaceId, stationId, statusName) => {
  let statusType = {};
  const tasksRef = db
    .collection("space")
    .doc(spaceId)
    .collection("stations")
    .doc(stationId)
    .collection("tasks")
    .doc("tasks");
  tasksRef
    .get()
    .then((taskData) => {
      statusType = taskData.data().statusType;
      statusType = {
        ...statusType,
        [statusName]: {
          ...statusType[statusName],
          open: !statusType[statusName].open,
        },
      };
    })
    .then(() => {
      tasksRef.update({
        statusType,
      });
    });
};

export { db, auth, LoginWithGoogle, loginWithEmailAndPassword, createNewSpace };
