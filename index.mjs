import {parseString} from "xml2js"
import fs from "fs"

const [,,file]= process.argv

if ( !file ) {
    console.log("Usage: node index.mjs <file>")
    process.exit(1)
}

function to_xyz(str) {
    const [x, y, z] = str.split(" ").map(parseFloat)
    return {x, y, z}
}

function to_rpy(str) {
    const [r, p, y] = str.split(" ").map(parseFloat)
    return {r, p, y}
}

const text=fs.readFileSync(file)
parseString(text, (err, result) => {
    if (err) {
        console.error(err)
        process.exit(1)
    }

    const links=result.robot.link.slice(1) // ignore the first link
    const joints=result.robot.joint

    if ( links.length !== joints.length ) {
        console.error("Links and joints do not match once first link is ignored")
        process.exit(1)
    }

    const combined=links.map((link, i) => {
        let joint = joints[i];
        return {
            urdfFrame: {
                translation: to_xyz(joint.origin[0].$.xyz),
                rpy: to_rpy(joint.origin[0].$.rpy)
            },
            rigidBodyInertia: {
                m: parseFloat(link.inertial[0].mass[0].$.value),
                h: to_xyz(link.inertial[0].origin[0].$.xyz),
                Ixx: parseFloat(link.inertial[0].inertia[0].$.ixx),
                Iyy: parseFloat(link.inertial[0].inertia[0].$.iyy),
                Izz: parseFloat(link.inertial[0].inertia[0].$.izz),
                Ixy: parseFloat(link.inertial[0].inertia[0].$.ixy),
                Ixz: parseFloat(link.inertial[0].inertia[0].$.ixz),
                Iyz: parseFloat(link.inertial[0].inertia[0].$.iyz)
            },
            jointAxis: to_xyz(joint.axis[0].$.xyz),
            damping: parseFloat(joint.dynamics[0].$.damping),
            friction: parseFloat(joint.dynamics[0].$.friction),
        }
    })
    console.log(JSON.stringify(combined, null, 2))
})

