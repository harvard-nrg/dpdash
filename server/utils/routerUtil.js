import { createHash } from 'crypto';
import { ObjectID } from 'mongodb';

const getConfigForUser = async ({ db, user, defaultConfig }) => {
  const foundUser = await db.collection('users').findOne(
    { uid: user },
    { _id: 0, preferences: 1 },
  );
  if (!foundUser || Object.keys(foundUser).length === 0) {
    throw new Error('User not found');
  } 
  let foundConfig = await db.collection('configs').findOne({ readers: user });
  if (foundUser['preferences'] 
    && 'config' in foundUser['preferences']
    && foundUser['preferences']['config'] !== ''
  ) {
    const userConfig = await db.collection('configs').findOne({
      readers: user,
      _id: new ObjectID(foundUser['preferences']['config'])
    });
    if (userConfig && userConfig['config'] && Object.keys(userConfig['config']).length !== 0) { 
      foundConfig = userConfig;
    }
  }
  if (!foundConfig || !foundConfig['config'] || Object.keys(foundConfig['config']).length === 0) {
    return defaultConfig;
  }
  return foundConfig['config'][Object.keys(foundConfig['config'])[0]];
}

const getDashboardState = async ({ db, study, subject, defaultConfig }) => {
  let dashboardState = {
    matrixData: [],
    yAxisData: [],
    assessmentNames: [],
    matrixConfig: defaultConfig,
    subject: subject,
    project: study,
    consentDate: '',
    updated: ''
  };
  const metadocReference = await db.collection('metadata').findOne({
    study: study,
    role: 'metadata'
  });
  if (metadocReference != null) {
    dashboardState.updated = metadocReference.updated;
    if ('collection' in metadocReference) {
      const metadoc = await db.collection(metadocReference.collection).find({}).toArray();
      if (metadoc && metadoc != []) {
        for (const item in metadoc) {
          if (metadoc[item]['Subject ID'] === subject && (metadoc[item]['Consent'] || metadoc[item]['Consent Date'])) {
            dashboardState.consentDate = metadoc[item]['Consent'] || metadoc[item]['Consent Date'];
          }
        }
      }
    }
  }
  for (const configItem in defaultConfig) {
    if (defaultConfig[configItem].variable === '' || defaultConfig[configItem].analysis === '') {
      continue;
    }
    dashboardState.yAxisData.push(defaultConfig[configItem].label);
    dashboardState.assessmentNames.push(defaultConfig[configItem].analysis);
    const assessment = defaultConfig[configItem].analysis;
    const collectionName = study + subject + assessment;
    const encrypted = createHash('sha256').update(collectionName).digest('hex');
    const varName = defaultConfig[configItem].variable;
    const escapedVarName = encodeURIComponent(varName).replace(/\./g, '%2E');
    const query = [{
      $project: { _id: 0, day: 1, [escapedVarName]: `$${varName}` }
    }];
    const data = await db.collection(encrypted.toString()).aggregate(query).toArray();
    const queryForStat = [
      {
        $match: {
          [escapedVarName]: { $ne: '' }
        }
      },
      {
        $group: {
          _id: null,
          min: {
            $min: `$${escapedVarName}`
          },
          max: {
            $max: `$${escapedVarName}`
          },
          mean: {
            $avg: `$${escapedVarName}`
          }
        }
      }
    ]
    const stat = await db.collection(encrypted.toString()).aggregate(queryForStat).toArray();
    const dataPiece = {};
    dataPiece.text = defaultConfig[configItem].text;
    dataPiece.analysis = defaultConfig[configItem].analysis;
    dataPiece.category = defaultConfig[configItem].category;
    dataPiece.variable = defaultConfig[configItem].variable;
    dataPiece.label = defaultConfig[configItem].label;
    dataPiece.range = defaultConfig[configItem].range;
    dataPiece.color = defaultConfig[configItem].color;
    dataPiece.data = (
      data.length >= 1 &&
      Object.prototype.hasOwnProperty.call(data[0], defaultConfig[configItem].variable)
    ) ? data : [];
    dataPiece.stat = (stat.length >= 1) ? stat : [];
    dashboardState.matrixData.push(dataPiece);
  }
  return dashboardState;
};

export { getConfigForUser, getDashboardState };
