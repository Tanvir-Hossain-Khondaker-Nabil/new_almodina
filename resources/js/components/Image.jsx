import React from 'react'

export default function Image({ path = null, className = '' }) {
    return (
        <>
            {path ? (
                <img src={`/media/uploads/${path}`} className={className} />
            ) : (

                <img src="/media/static/blank.jpg" className={className} />
            )}
        </>
    )
}
