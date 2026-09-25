import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN =  process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function ThreeCanvas({
  selectedDataset,
  activeBuildingId,
  activeFloorIndex,
  explodedView,
  isolatedFloor,
  onSelectBuildingFloor,
  flyToTarget
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const customLayerRef = useRef(null);
  const buildingMeshesRef = useRef([]);

  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/light-v11');
  const [hoveredFloorInfo, setHoveredFloorInfo] = useState(null);

  // Re-initialize Mapbox Map & Custom 3D Layer when selectedDataset changes
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const mbgl = mapboxgl || (typeof window !== 'undefined' ? window.mapboxgl : null);
    if (!mbgl) return;

    mbgl.accessToken = MAPBOX_TOKEN;

    const lng = selectedDataset?.coordinates?.lng || 77.7607;
    const lat = selectedDataset?.coordinates?.lat || 12.9982;

    // Create Mapbox GL Map instance
    const map = new mbgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [lng, lat],
      zoom: 17.5,
      pitch: 55,
      bearing: -15,
      interactive: true,
      attributionControl: true
    });

    mapRef.current = map;
    const parcelRing = selectedDataset?.geometry?.coordinates?.[0];
    if (parcelRing?.length) {
      const bounds = parcelRing.reduce((box, point) => box.extend(point), new mbgl.LngLatBounds(parcelRing[0], parcelRing[0]));
      map.fitBounds(bounds, { padding: 100, duration: 0, maxZoom: 17 });
    }

    // Add Navigation Controls (Zoom / Rotate)
    map.addControl(new mbgl.NavigationControl(), 'bottom-right');

    // Create Custom Three.js Layer locked 100% to Mapbox Mercator projection
    const modelOrigin = [lng, lat];
    const modelAltitude = 0;
    const modelRotate = [Math.PI / 2, 0, 0];

    const customLayer = {
      id: '3d-cadastral-layer',
      type: 'custom',
      renderingMode: '3d',

      onAdd: function (map, gl) {
        this.camera = new THREE.PerspectiveCamera();
        this.scene = new THREE.Scene();

        // Lighting inside Mapbox scene
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
        dirLight.position.set(100, 200, 100);
        this.scene.add(dirLight);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        hemiLight.position.set(0, 100, 0);
        this.scene.add(hemiLight);

        // Build 3D Buildings
        this.buildBuildings(selectedDataset);

        // Setup WebGL Renderer sharing Mapbox GL context
        this.renderer = new THREE.WebGLRenderer({
          canvas: map.getCanvas(),
          context: gl,
          antialias: true
        });
        this.renderer.autoClear = false;
      },

      buildBuildings: function (dataset) {
        // Clean old meshes
        buildingMeshesRef.current.forEach(({ meshGroup }) => {
          this.scene.remove(meshGroup);
        });
        buildingMeshesRef.current = [];

        if (!dataset || !dataset.buildings) return;

        const buildings = dataset.buildings;
        const spacingX = 22;
        const spacingZ = 20;

        buildings.forEach((bldg, bIndex) => {
          const meshGroup = new THREE.Group();

          const col = bIndex % 2;
          const row = Math.floor(bIndex / 2);
          const posX = (col - 0.5) * spacingX;
          const posZ = (row - 0.5) * spacingZ;

          meshGroup.position.set(posX, 0, posZ);

          const width = Math.sqrt(bldg.footprint) * 0.55;
          const depth = Math.sqrt(bldg.footprint) * 0.55;
          const floorHeight = 4.2;

          const floorMeshes = [];

          bldg.floors.forEach((floor, fIndex) => {
            const floorGeo = new THREE.BoxGeometry(width, floorHeight - 0.4, depth);

            const baseColor = new THREE.Color(floor.color || '#3b82f6');
            const floorMat = new THREE.MeshStandardMaterial({
              color: baseColor,
              roughness: 0.3,
              metalness: 0.2,
              transparent: true,
              opacity: 0.92
            });

            const floorMesh = new THREE.Mesh(floorGeo, floorMat);
            const initialY = fIndex * floorHeight + (floorHeight - 0.4) / 2 + 0.2;
            floorMesh.position.set(0, initialY, 0);

            // Wireframe Edges
            const edgesGeo = new THREE.EdgesGeometry(floorGeo);
            const edgesMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
            const edgesWireframe = new THREE.LineSegments(edgesGeo, edgesMat);
            floorMesh.add(edgesWireframe);

            floorMesh.userData = {
              bldgId: bldg.id,
              floorIndex: fIndex,
              floorData: floor,
              bldgData: bldg,
              baseY: initialY
            };

            meshGroup.add(floorMesh);
            floorMeshes.push(floorMesh);
          });

          this.scene.add(meshGroup);
          buildingMeshesRef.current.push({
            bldgId: bldg.id,
            meshGroup,
            floorMeshes,
            centerPos: new THREE.Vector3(posX, bldg.floors.length * 2, posZ)
          });
        });
      },

      render: function (gl, matrix) {
        const mbgl = mapboxgl || (typeof window !== 'undefined' ? window.mapboxgl : null);
        const modelAsMercatorCoordinate = mbgl.MercatorCoordinate.fromLngLat(
          modelOrigin,
          modelAltitude
        );

        // Transformation matrix converting Three.js meter scale to Mapbox Mercator lat/lng space
        const modelTransform = {
          translateX: modelAsMercatorCoordinate.x,
          translateY: modelAsMercatorCoordinate.y,
          translateZ: modelAsMercatorCoordinate.z,
          rotateX: modelRotate[0],
          rotateY: modelRotate[1],
          rotateZ: modelRotate[2],
          scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
        };

        const rotationX = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(1, 0, 0),
          modelTransform.rotateX
        );
        const rotationY = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(0, 1, 0),
          modelTransform.rotateY
        );
        const rotationZ = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(0, 0, 1),
          modelTransform.rotateZ
        );

        const m = new THREE.Matrix4().fromArray(matrix);
        const l = new THREE.Matrix4()
          .makeTranslation(
            modelTransform.translateX,
            modelTransform.translateY,
            modelTransform.translateZ
          )
          .scale(
            new THREE.Vector3(
              modelTransform.scale,
              -modelTransform.scale,
              modelTransform.scale
            )
          )
          .multiply(rotationX)
          .multiply(rotationY)
          .multiply(rotationZ);

        this.camera.projectionMatrix = m.multiply(l);
        this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();

        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
        map.triggerRepaint();
      }
    };

    customLayerRef.current = customLayer;

    map.on('style.load', () => {
      if (selectedDataset?.geometry) {
        map.addSource('saved-parcel', {type:'geojson',data:{type:'Feature',properties:{},geometry:selectedDataset.geometry}});
        map.addLayer({id:'saved-parcel-fill',type:'fill',source:'saved-parcel',paint:{'fill-color':'#2563eb','fill-opacity':0.25}});
        map.addLayer({id:'saved-parcel-outline',type:'line',source:'saved-parcel',paint:{'line-color':'#2563eb','line-width':3}});
      }
      if (selectedDataset?.buildings?.length && !map.getLayer('3d-cadastral-layer')) {
        map.addLayer(customLayer);
      }
    });

    return () => {
      if (map) {
        map.remove();
        mapRef.current = null;
      }
    };
  }, [selectedDataset, mapStyle]);

  // Update Exploded View & Isolated Floor transformations inside custom layer
  useEffect(() => {
    const explosionFactor = (explodedView || 0) / 100;

    buildingMeshesRef.current.forEach(({ floorMeshes }) => {
      floorMeshes.forEach((mesh) => {
        const { baseY, floorIndex } = mesh.userData;

        // Vertical explosion offset
        const explosionOffsetY = floorIndex * 8.0 * explosionFactor;
        mesh.position.y = baseY + explosionOffsetY;

        // Isolation filter opacity
        if (isolatedFloor !== null && isolatedFloor !== undefined && isolatedFloor !== 'all') {
          const targetIndex = parseInt(isolatedFloor, 10);
          if (floorIndex === targetIndex) {
            mesh.material.opacity = 1.0;
            mesh.material.transparent = false;
          } else {
            mesh.material.opacity = 0.25;
            mesh.material.transparent = true;
          }
        } else {
          mesh.material.opacity = 0.92;
          mesh.material.transparent = true;
        }

        // Active selection glow
        const isSelected =
          mesh.userData.bldgId === activeBuildingId &&
          (activeFloorIndex === null || mesh.userData.floorIndex === activeFloorIndex);

        if (isSelected) {
          mesh.material.emissive = new THREE.Color('#3b82f6');
          mesh.material.emissiveIntensity = 0.5;
        } else {
          mesh.material.emissive = new THREE.Color(0x000000);
          mesh.material.emissiveIntensity = 0;
        }
      });
    });
  }, [explodedView, isolatedFloor, activeBuildingId, activeFloorIndex]);

  // Handle Raycasting Hover & Click on Mapbox Canvas
  const handleMouseMove = (e) => {
    const customLayer = customLayerRef.current;
    const map = mapRef.current;
    if (!customLayer || !customLayer.camera || !map) return;

    const rect = map.getCanvas().getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), customLayer.camera);

    const allFloorMeshes = [];
    buildingMeshesRef.current.forEach(({ floorMeshes }) => {
      allFloorMeshes.push(...floorMeshes);
    });

    const intersects = raycaster.intersectObjects(allFloorMeshes);

    if (intersects.length > 0) {
      map.getCanvas().style.cursor = 'pointer';
      const hitMesh = intersects[0].object;
      const { floorData, bldgId, floorIndex } = hitMesh.userData;

      setHoveredFloorInfo({
        x: e.clientX,
        y: e.clientY,
        bldgId,
        floorIndex,
        label: floorData.label,
        classification: floorData.classification,
        color: floorData.color || '#3b82f6',
        ulpin: floorData.ulpin,
        area: floorData.area,
        khasra: floorData.khasra,
        ownerName: floorData.ownerName,
        aadhaarVerified: floorData.aadhaarVerified,
        dilrmpSynced: floorData.dilrmpSynced
      });
    } else {
      map.getCanvas().style.cursor = '';
      setHoveredFloorInfo(null);
    }
  };

  const handleClick = (e) => {
    const customLayer = customLayerRef.current;
    const map = mapRef.current;
    if (!customLayer || !customLayer.camera || !map) return;

    const rect = map.getCanvas().getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), customLayer.camera);

    const allFloorMeshes = [];
    buildingMeshesRef.current.forEach(({ floorMeshes }) => {
      allFloorMeshes.push(...floorMeshes);
    });

    const intersects = raycaster.intersectObjects(allFloorMeshes);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const { bldgId, floorIndex } = hitMesh.userData;
      onSelectBuildingFloor(bldgId, floorIndex);
    }
  };

  // Fly Camera to building target
  useEffect(() => {
    if (!flyToTarget || !mapRef.current) return;

    const target = buildingMeshesRef.current.find((b) => b.bldgId === flyToTarget);
    if (target) {
      const lng = selectedDataset?.coordinates?.lng || 77.7607;
      const lat = selectedDataset?.coordinates?.lat || 12.9982;
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 18.2,
        pitch: 60,
        bearing: -20,
        essential: true,
        duration: 1500
      });
    }
  }, [flyToTarget, selectedDataset]);

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    >
      {/* Mapbox Canvas Container (Hosts both Mapbox Map & Embedded 3D Layer) */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full z-0"
      />

      {/* Hover Floor Details Tooltip */}
      {hoveredFloorInfo && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-4 transition-all duration-75"
          style={{ left: hoveredFloorInfo.x, top: hoveredFloorInfo.y }}
        >
          <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs p-3 rounded-xl border border-slate-700/80 shadow-2xl space-y-1.5 min-w-[250px]">
            <div className="flex items-center justify-between space-x-2 border-b border-slate-800 pb-1.5">
              <span className="font-bold text-slate-200 font-mono">{hoveredFloorInfo.bldgId}</span>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide text-white uppercase"
                style={{ backgroundColor: hoveredFloorInfo.color }}
              >
                {hoveredFloorInfo.classification}
              </span>
            </div>
            <div className="text-slate-100 font-semibold text-sm">{hoveredFloorInfo.label}</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
              <div>ULPIN: <span className="text-slate-200 font-mono font-medium">{hoveredFloorInfo.ulpin}</span></div>
              <div>Area: <span className="text-slate-200 font-mono font-medium">{hoveredFloorInfo.area} m²</span></div>
              <div>Khasra: <span className="text-slate-200 font-medium">{hoveredFloorInfo.khasra}</span></div>
              <div>Owner: <span className="text-slate-200 font-medium truncate">{hoveredFloorInfo.ownerName}</span></div>
            </div>
            <div className="flex items-center space-x-2 pt-1 text-[10px]">
              {hoveredFloorInfo.aadhaarVerified && (
                <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/40 font-medium">
                  ✓ Aadhaar Verified
                </span>
              )}
              {hoveredFloorInfo.dilrmpSynced && (
                <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/40 font-medium">
                  ✓ DILRMP Synced
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Controls Overlay */}
      <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
        <button
          onClick={() =>
            setMapStyle((prev) =>
              prev.includes('light')
                ? 'mapbox://styles/mapbox/satellite-streets-v12'
                : 'mapbox://styles/mapbox/light-v11'
            )
          }
          className="bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full border border-slate-700/70 shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer"
        >
          <span>🌐 Map: {mapStyle.includes('satellite') ? 'Satellite Hybrid' : 'Light Vector (India)'}</span>
          <span className="text-blue-400 underline ml-1">Switch</span>
        </button>

        <div className="bg-slate-900/80 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full border border-slate-700/60 shadow-lg pointer-events-none flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Pinned Cadastral 3D Engine · Drag Map to Pan/Rotate</span>
        </div>
      </div>
    </div>
  );
}
