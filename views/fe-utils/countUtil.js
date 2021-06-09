const getCounts = ({ acl }) => {
  const options = [];
  for (let study = 0; study < acl.length; study++) {
    options.push(...acl[study].subjects);
  }
  return {
    totalStudies: acl.length,
    totalSubjects: options.length,
    totalDays: Math.max.apply(Math, options.map(function (o) { return o.days; }))
  };
}

export default getCounts;
