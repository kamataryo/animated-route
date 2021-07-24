const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("file");
const mapElement = document.getElementById("map");

dropzone.addEventListener("dragover", (e) => {
  e.stopPropagation();
  e.preventDefault();
  dropzone.style.background = "#aaa";
});
dropzone.addEventListener("dragleave", (e) => {
  e.stopPropagation();
  e.preventDefault();
  dropzone.style.background = "#ffffff";
});

dropzone.addEventListener("drop", (e) => {
  e.stopPropagation();
  e.preventDefault();
  dropzone.style.background = "#ffffff";
  const files = e.dataTransfer.files;
  if (files.length > 1) {
    return alert("You can only upload one GeoJSON.");
  }
  fileInput.files = files;
  main(files[0]);
});

fileInput.addEventListener("change", (e) => {
  main(e.target.files[0]);
});

const main = (file) => {
  dropzone.style.display = "none";
  mapElement.style.display = "block";
  const map = new window.geolonia.Map(mapElement);
  map.on("load", async () => {
    let geojson;
    try {
      geojson = await readGeoJSON(file);
    } catch (error) {
      console.error(error);
      alert(error.message);
      return;
    }
    const deparature = [...geojson.features[0].geometry.coordinates[0]];
    map.setCenter(deparature);
    map.setZoom(12);
    const initial = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: geojson.features[0].geometry.coordinates[0],
          },
        },
      ],
    };
    const terminal = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates:
              geojson.features[0].geometry.coordinates[
                geojson.features[0].geometry.coordinates.length - 1
              ],
          },
        },
      ],
    };
    const growingLine = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [geojson.features[0].geometry.coordinates[0]],
          },
        },
      ],
    };
    map.addSource("ar-init", { type: "geojson", data: initial });
    map.addLayer({
      id: "ar-init-l",
      type: "circle",
      source: "ar-init",
      paint: {
        "circle-radius": 5,
        "circle-color": "red",
      },
    });
    map.addSource("ar-route", {
      type: "geojson",
      data: growingLine,
    });
    map.addLayer({
      id: "ar-route-layer",
      type: "line",
      source: "ar-route",
      layout: {},
      paint: {
        "line-color": "red",
        "line-width": 2,
      },
    });

    animate(geojson, map, () => {
      map.addSource("ar-term", { type: "geojson", data: terminal });
      map.addLayer({
        id: "ar-term-l",
        type: "circle",
        source: "ar-term",
        paint: {
          "circle-radius": 5,
          "circle-color": "red",
        },
      });
    });
  });
};

/**
 *
 * @param {File} file
 * @returns
 */
const readGeoJSON = (file) => {
  return new Promise((resolve, reject) => {
    const filereader = new FileReader();
    filereader.onload = () => {
      try {
        const geojson = JSON.parse(filereader.result);
        if (
          !geojson.features ||
          geojson.features[0].geometry.type !== "LineString"
        ) {
          throw new Error();
        }
        resolve(geojson);
      } catch (_e) {
        console.error(_e);
        const handledError = new Error("Should be a GeoJSON with LineString.");
        reject(handledError);
      }
    };
    filereader.onerror = (_e) => {
      console.error(_e);
      const handledError = new Error("Failed to read the file.");
      reject(handledError);
    };
    filereader.readAsText(file);
  });
};

const animate = (geojson, map, callback) => {
  let counter = 0;
  const growingLine = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
        },
      },
    ],
  };

  const timerId = setInterval(() => {
    if (counter === geojson.features[0].geometry.coordinates.length) {
      clearInterval(timerId);
      callback();
      return;
    } else {
      growingLine.features[0].geometry.coordinates =
        geojson.features[0].geometry.coordinates.slice(0, counter);
      const center = geojson.features[0].geometry.coordinates[counter];
      map.setCenter(center);
      map.getSource("ar-route").setData(growingLine);
      counter++;
    }
  }, 1);
};
