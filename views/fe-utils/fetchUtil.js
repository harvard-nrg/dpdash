const fetchStudies = async () => {
  const res = await window.fetch('/api/v1/search/studies', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin'
  })
  if (res.status !== 200) {
    throw new Error(res.statusText);
  }
  return res.json();
}

const fetchSubjects = async () => {
  const userAccess = await window.fetch('/api/v1/studies', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin'
  });
  if (userAccess.status !== 200) {
    throw new Error(userAccess.statusText);
  }
  const studiesJson = await userAccess.json();
  const studies = studiesJson ? studiesJson : [];
  const subjectsResponse = await window.fetch('/api/v1/subjects?q=' + JSON.stringify(studies), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
  })
  if (subjectsResponse.status !== 200) {
    throw new Error(subjectsResponse.statusText);
  }
  return subjectsResponse.json();
};

const fetchUsers = async () => {
  const res = await window.fetch('/api/v1/users', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin'
  })
  if (res.status !== 200) {
    throw new Error(res.statusText);
  }
  return res.json()
};

const fetchUsernames = async () => {
  const res = await window.fetch('/api/v1/search/users', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin'
  });
  if (res.status !== 200) {
    throw new Error(res.statusText);
  }
  return res.json()
}

export { fetchStudies, fetchSubjects, fetchUsers, fetchUsernames };
