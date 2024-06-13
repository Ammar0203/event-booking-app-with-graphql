import React, { useState, useContext } from 'react'
import { useQuery, useMutation, useApolloClient, useSubscription } from '@apollo/client'
import { EVENTS, BOOK_EVENT, CREATE_EVENT, EVENT_ADDED } from '../queries'
import EventItem from '../components/EventItem'
import SimpleModal from '../components/SimpleModal'
import AuthContext from '../context/auth-context'
import { NavLink } from 'react-router-dom'
import Error from '../components/Error'
import Spinner from '../components/Spinner'

export default function EventsPage() {
    const [selectedEvent, setSelectedEvent] = useState(null)
    const value = useContext(AuthContext)
    const [alert, setAlert] = useState('')
    const [modelAlert, setModelAlert] = useState('')
    const [creating, setCreating] = useState(false)
    const [title, setTitle] = useState("")
    const [price, setPrice] = useState("")
    const [date, setDate] = useState("")
    const [description, setDescription] = useState("")
    const client = useApolloClient()
    useSubscription(EVENT_ADDED, {
        onSubscriptionData: async ({ subscriptionData }) => {
            if (subscriptionData.data) {
                const addedEvent = subscriptionData.data.eventAdded
                setAlert(`مناسبة جديدة بعنوان: ${addedEvent.title}، أُضيفت للتو`)
                window.scrollTo(0, 0)
            }
            if (subscriptionData.errors) setAlert("خطأ في جلب المناسبات الجديدة")
        }
    })

    function EventList() {
        const { loading, error, data } = useQuery(EVENTS) 
        
        if (loading) { return <Spinner /> }
        if (error) {
            setAlert(error.message)
            return
        }

        client.refetchQueries({
            include: ["Events"],
        })

        const showDetailHandler = eventId => {
            const clickedEvent = data.events.find(event => event._id === eventId)
            setSelectedEvent(clickedEvent)
        }

        return (
            <div className="container-fluid">
                <div className="row justify-content-center">
                    {data.events.map(event => (
                        <EventItem
                            key={event._id}
                            {...event}
                            onDetail={showDetailHandler}
                        />
                    ))}
                </div>
            </div>
        )
    }

    const [bookEventHandler] = useMutation(BOOK_EVENT, {
        onError: (error) => {
            setSelectedEvent(null)
            setAlert(error.message)
            window.scrollTo(0, 0)
        },
        onCompleted: () => {
            setSelectedEvent(null)
            setAlert("تم حجز المناسبة بنجاح")
        }
    })

    const [eventConfirmHandler, { loading, error }] = useMutation(CREATE_EVENT, {
        onError: (error) => {
            setCreating(false)
            setAlert(error.message)
        },
        onCompleted: () => {
            setCreating(false)
            setAlert("تم إضافة المناسبة بنجاح")
            setModelAlert("")
            client.refetchQueries({
                include: ["Events"],
            })
        },
    })

    if (loading) { return <Spinner /> }
    if (error) { 
        setAlert(error.message) 
        return
    }
   

    return (
        <div>
            {value.token && <Error error={alert} />}
            {value.token && (
                <div className='events-control pt-2 text-center pb-3'>
                    <h2>شارك مناسباتك الخاصة!</h2>
                    <button className='btn' onClick={() => setCreating(true)}>
                        إنشاء مناسبة
                    </button>
                </div>
            )}
            <div>
                <h2 className="mb-3">المناسبات من حولك!</h2>
                <EventList />
            </div>
            {creating && (
                <SimpleModal
                    title='إضافة مناسبة'
                    onCancel={() => {
                        setCreating(false)
                        setAlert("")
                        setModelAlert("")
                    }}
                    onConfirm={() => {
                        if (
                            title.trim().length === 0 ||
                            price <= 0 ||
                            date.trim().length === 0 ||
                            description.trim().length === 0
                        ) {
                            setModelAlert("يجب ملئ جميع الحقول بالشكل الصحيح!")
                            return
                        }
                        eventConfirmHandler(
                            { variables: { title: title, price: +price, date: date, description: description } }
                        )
                        setTitle("")
                        setPrice("")
                        setDate("")
                        setDescription("")
                    }}
                    confirmText='تأكيد'
                >
                    <form>
                        <Error error={modelAlert} />
                        <div className="mb-1">
                            <label className="form-label" htmlFor='title'>العنوان</label>
                            <input
                                className="form-control"
                                required
                                type='text'
                                id='title'
                                value={title}
                                onChange={({ target }) => setTitle(target.value)}
                            />
                        </div>
                        <div className="mb-1 mt-1">
                            <label className="form-label" htmlFor='price'>السعر</label>
                            <input
                                className="form-control"
                                required
                                type='number'
                                id='price'
                                value={price}
                                onChange={({ target }) => setPrice(target.value)}
                            />
                        </div>
                        <div className="mb-1 mt-1">
                            <label className="form-label" htmlFor='date'>التاريخ</label>
                            <input
                                className="form-control"
                                required
                                type='datetime-local'
                                id='date'
                                value={date}
                                onChange={({ target }) => setDate(target.value)}
                            />
                        </div>
                        <div className="mb-1 mt-1">
                            <label className="form-label" htmlFor='description'>التفاصيل</label>
                            <textarea
                                className="form-control"
                                required id='description'
                                rows='3'
                                value={description}
                                onChange={({ target }) => setDescription(target.value)}
                            />
                        </div>
                    </form>
                </SimpleModal>
            )}
            {selectedEvent && (
                <SimpleModal
                    title='حجز المناسبة'
                    onCancel={() => {
                        setCreating(false)
                        setSelectedEvent(null)
                        setAlert("")
                    }}
                    onConfirm={() => {
                        bookEventHandler({ variables: { eventId: selectedEvent._id } })
                    }}
                    confirmText={value.token ? 'احجز' : <NavLink to='/login'>سجل دخول لتحجز</NavLink>}
                    isDisabled={selectedEvent.creator._id === value.userId ? true : false}
                >
                    <h4 className='mb-4'>{selectedEvent.title}</h4>
                    <h4 className='mb-4'>
                        ${selectedEvent.price} {'-'} {selectedEvent.date.split('.')[0].replace(/-/g, "/")}
                    </h4>
                    <p>{selectedEvent.description}</p>
                </SimpleModal>
            )}
        </div>
    )
}