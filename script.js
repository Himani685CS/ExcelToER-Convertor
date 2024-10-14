
    
        let networkData = null;

        document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);

        function handleFileSelect(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                const { nodes, edges } = convertSheetToNodesAndEdges(sheet);

                networkData = {
                    nodes: new vis.DataSet(nodes),
                    edges: new vis.DataSet(edges)
                };

                updateNetworkVisualization();
            };
            reader.readAsArrayBuffer(file);
        }

        function convertSheetToNodesAndEdges(sheet) {
            const nodes = [];
            const edges = [];

            const headers = getHeaderRow(sheet);
            if (!headers) {
                alert('Sheet does not have the expected headers (Entity1, Entity2, Relationship, Attribute1, Attribute2)');
                return { nodes, edges };
            }

            const entity1Index = headers.indexOf('Entity1');
            const entity2Index = headers.indexOf('Entity2');
            const relationshipIndex = headers.indexOf('Relationship');
            const attribute1Index = headers.indexOf('Attribute1');
            const attribute2Index = headers.indexOf('Attribute2');

            const range = XLSX.utils.decode_range(sheet['!ref']);
            for (let i = range.s.r + 1; i <= range.e.r; ++i) {
                const entity1 = sheet[XLSX.utils.encode_cell({ r: i, c: entity1Index })]?.v;
                const entity2 = sheet[XLSX.utils.encode_cell({ r: i, c: entity2Index })]?.v;
                const relationship = sheet[XLSX.utils.encode_cell({ r: i, c: relationshipIndex })]?.v;
                const attribute1 = sheet[XLSX.utils.encode_cell({ r: i, c: attribute1Index })]?.v;
                const attribute2 = sheet[XLSX.utils.encode_cell({ r: i, c: attribute2Index })]?.v;

                if (entity1 && entity2 && relationship) {
                    addNodeIfNotExists(nodes, entity1, 'box');
                    addNodeIfNotExists(nodes, entity2, 'box');

                    const relNode = `${entity1}_${relationship}_${entity2}`;
                    addNodeIfNotExists(nodes, relNode, 'diamond', relationship);
                    addEdgeIfNotExists(edges, entity1, relNode, 'to');
                    addEdgeIfNotExists(edges, relNode, entity2, 'to');

                    if (attribute1) {
                        const attr1Node = `${entity1}_${attribute1}`;
                        addNodeIfNotExists(nodes, attr1Node, 'ellipse');
                        addEdgeIfNotExists(edges, entity1, attr1Node, 'to');
                    }

                    if (attribute2) {
                        const attr2Node = `${entity1}_${attribute2}`;
                        addNodeIfNotExists(nodes, attr2Node, 'ellipse');
                        addEdgeIfNotExists(edges, entity1, attr2Node, 'to');
                    }
                }
            }

            return { nodes, edges };
        }

        function getHeaderRow(sheet) {
            const headers = [];
            for (let col = 'A'.charCodeAt(0); col <= 'Z'.charCodeAt(0); col++) {
                const cellAddress = String.fromCharCode(col) + '1';
                if (!sheet[cellAddress]) break;
                headers.push(sheet[cellAddress].v.trim());
            }
            const expectedHeaders = ['Entity1', 'Entity2', 'Relationship', 'Attribute1', 'Attribute2'];
            if (headers.length !== expectedHeaders.length || !expectedHeaders.every((value, index) => value === headers[index])) {
                return null;
            }
            return headers;
        }

        function addNodeIfNotExists(nodes, nodeId, shape, label = null) {
            if (!nodes.find(node => node.id === nodeId)) {
                nodes.push({ id: nodeId, label: label ? label : nodeId, shape: shape });
            }
        }

        function addEdgeIfNotExists(edges, fromNode, toNode, arrows) {
            if (!edges.find(edge => edge.from === fromNode && edge.to === toNode)) {
                edges.push({ from: fromNode, to: toNode, arrows: arrows });
            }
        }

        function updateNetworkVisualization() {
            if (!networkData) return;

            const container = document.getElementById('mynetwork');
            const options = {
                nodes: {
                    shape: 'box',
                    font: { size: 14 }
                },
                edges: {
                    font: { size: 12 }
                },
                physics: { enabled: true }
            };
            const network = new vis.Network(container, networkData, options);
        }
    