export default function parseData(data) {
  const resultArray = [];

  for (const day in data) {
    if (data.hasOwnProperty(day)) {
      data[day].forEach((muscle) => {
        resultArray.push(`${day}-${muscle}`);
      });
    }
  }
  return resultArray;
}
