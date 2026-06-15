
function calculateAngleBetweenVectors(vecA, vecB) {

    const dotProduct = vecA.x * vecB.x + vecA.y * vecB.y + vecA.z * vecB.z;
    
    const normA = Math.sqrt(vecA.x * vecA.x + vecA.y * vecA.y + vecA.z * vecA.z);
    const normB = Math.sqrt(vecB.x * vecB.x + vecB.y * vecB.y + vecB.z * vecB.z);
    
    if (normA === 0 || normB === 0) return 0;
    
    let cosineValue = dotProduct / (normA * normB);
    cosineValue = Math.max(-1, Math.min(1, cosineValue));
    
    return Math.acos(cosineValue);
}

async function runHandpose(videoElement, outputElement) {
    const model = await handpose.load();
    console.log("Handpose uploaded");

    const getFingerVector = (keypoints, mcpIndex, tipIndex) => {
        const mcp = keypoints[mcpIndex];
        const tip = keypoints[tipIndex];
        return {
            x: tip[0] - mcp[0],
            y: tip[1] - mcp[1],
            z: tip[2] - mcp[2]
        };
    };

    const radiansToDegrees = (radians) => radians * (180 / Math.PI);

    setInterval(async () => {
        const predictions = await model.estimateHands(videoElement);
        
        if (predictions.length > 0) {
            const keypoints = predictions[0].landmarks;
            
            
            const vectors = {
                thumb:   getFingerVector(keypoints, 2, 4),  
                index:   getFingerVector(keypoints, 5, 8),  
                middle:  getFingerVector(keypoints, 9, 12),  
                ring:    getFingerVector(keypoints, 13, 16),
                pinky:   getFingerVector(keypoints, 17, 20)  
            };


            const angles = {
                thumbIndex:  radiansToDegrees(calculateAngleBetweenVectors(vectors.thumb, vectors.index)),
                indexMiddle: radiansToDegrees(calculateAngleBetweenVectors(vectors.index, vectors.middle)),
                middleRing:  radiansToDegrees(calculateAngleBetweenVectors(vectors.middle, vectors.ring)),
                ringPinky:   radiansToDegrees(calculateAngleBetweenVectors(vectors.ring, vectors.pinky))
            };

            outputElement.innerHTML = `
                <b>Angle:</b><br>
                ti: ${angles.thumbIndex.toFixed(1)}<br>
                im: ${angles.indexMiddle.toFixed(1)}<br>
                mr: ${angles.middleRing.toFixed(1)}<br>
                rp: ${angles.ringPinky.toFixed(1)}
            `;
            
        } else {
            outputElement.innerHTML = "Hand not detected";
        }
    }, 100);
}

const video = document.getElementById('my-video');
const output = document.getElementById('angles-result');

runHandpose(video, output).catch(err => console.error(err));