const { Tabs, Select, message, Menu, Layout, Row, Col, Spin, Empty, Table, Tag, Button } = antd;
const { TabPane } = Tabs
const { Header, Content } = Layout;

const LOAD_CACHE = {};
const MENU_INDEX = 0;
const TABLE_CONFIG = {
  '需求列表': {
    filters: ['project', 'users', 'status'],
    sorts: ['project', 'users', 'status', 'startDate', 'lastDate', 'durationDays'],
    render: {
      status: StatusTag,
      name: RequirementName,
    }
  }
}

document.querySelector('.loading').style.display = 'none'
window.App = App

function App() {
  const {
    loading, dataList,
    monthsOptions, selectedMonths, setSelectedMonths,
    selectedTableName, setSelectedTableName,
  } = useData()
  const [activeMonth, setActiveMonth] = React.useState()
  React.useEffect(() => {
    if (!activeMonth || !selectedMonths.includes(activeMonth)) setActiveMonth(selectedMonths[0])
  }, [selectedMonths])

  // console.log(loading, selectedMonths, dataList)
  return <Layout>
    <Header>
      <Row>
        <Col span={16}>
          <Menu theme="dark" mode="horizontal" selectedKeys={selectedTableName ? [selectedTableName] : []} onSelect={item => setSelectedTableName(item.key)}>
            {dataList[0]?.map(t => <Menu.Item key={t.name} children={t.name} />)}
          </Menu>
        </Col>
        <Col span={6} offset={2}>
          <Select mode="multiple" style={{width: '100%'}} allowClear options={monthsOptions} value={selectedMonths} onChange={setSelectedMonths} />
        </Col>
      </Row>
    </Header>
    <Content style={{ padding: 24, margin: 0, minHeight: 'calc(100vh - 64px)' }}>
      {
        loading
          ? <div style={{textAlign: 'center', padding: 50}}><Spin /></div>
          : !dataList.length
            ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            : <Data activeMonth={activeMonth} setActiveMonth={setActiveMonth} tableName={selectedTableName} months={selectedMonths} tables={dataList.map(list => list.filter(item => item.name === selectedTableName)[0])} />
      }
    </Content>
  </Layout>
}
function Data(props) {
  return (
    <div className={'data ' + (props.tableName === '人员每日投入情况' ? 'data2' : '')}>
      <DataTable {...props} />
      <DataChart {...props} />
    </div>
  )
}
function DataTable(props) {
  const { tables, months, activeMonth, setActiveMonth } = props
  return <Tabs className='dataTable' activeKey={activeMonth} onChange={v => setActiveMonth(v)}>
    {months.map((month, i) => {
      const table = tables[i]
      const columns = table.head.filter(h => !h.isLink).map(h => ({
        title: h.title,
        dataIndex: h.key,
        key: h.key,
        ...makeTableColumn(table, h.key)
      }))
      const dataSource = table.body

      return <TabPane tab={month} key={month}>
        <Table size='small' pagination={false} dataSource={dataSource} columns={columns} />
      </TabPane>
    })}
  </Tabs>
}
function DataChart(props) {
  const { tables, months, activeMonth } = props
  const getSeries = (stackKey, statKeys, statNames) => {
    const stats = {}
    const stacks = []

    tables.forEach((table, i) => {
      table.body.forEach(record => {
        const stack = record[stackKey]
        if (!stacks.includes(stack)) stacks.push(stack)

        statKeys.forEach(key => {
          if (!stats[key]) stats[key] = {}
          if (!stats[key][stack]) stats[key][stack] = []
          stats[key][stack][i] = record[key] || 0
        })
      })
    })

    const series = []
    stacks.forEach((stack) => {
      statKeys.forEach((statKey, i) => {
        series.push({
          stack,
          type: 'bar',
          name: statNames[i],
          data: stats[statKey][stack],
          label: {
            show: !i,
            position: 'insideBottom',
            formatter: stack
          },
        })
      })
    })
    return series
  }
  if (props.tableName === '项目统计表') {
    return <div className='dataChart' style={{display: 'flex'}}>
      <Chart
        options={{
          title: { text: '需求数量' },
          xAxis: { type: 'category', data: months, },
          yAxis: { type: 'value' },
          series: getSeries('name', ['historyCount', 'latestCount'], ['历史需求数量', '新增需求数量']),
        }}
      />
      <Chart
        options={{
          title: { text: '需求进展' },
          xAxis: { type: 'category', data: months, },
          yAxis: { type: 'value' },
          series: getSeries('name', ['finishedCount', 'progressCount', 'notStartCount'], ['已结束需求数量', '进行中需求数量', '未开始需求数量']),
        }}
      />
    </div>
  } else if (props.tableName === '人员统计表') {
    return <Chart
      className='dataChart'
      options={{
        title: { text: '人力投入情况' },
        xAxis: { type: 'category', data: months, },
        yAxis: { type: 'value' },
        series: getSeries('name', ['开发', '联调', '测试'], ['开发人日', '联调人日', '测试人日']),
      }}
    />
  } else if (props.tableName === '人员每日投入情况') {
    const table = tables[months.indexOf(activeMonth)]
    return <Chart
      key={activeMonth}
      className='dataChart'
      options={{
        title: { text: '人员每日投入情况' },
        tooltip: { trigger: 'axis' },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: table.body.map(b => b.date)
        },
        yAxis: { type: 'value' },
        series: [
          { name: '开发人日', type: 'line', stack: 'Total', data: table.body.map(b => b['开发']) },
          { name: '联调人日', type: 'line', stack: 'Total', data: table.body.map(b => b['联调']) },
          { name: '测试人日', type: 'line', stack: 'Total', data: table.body.map(b => b['测试']) },
        ]
      }}
    />
  }
  return null
}
function makeTableColumn(table, columnKey) {
  const config = TABLE_CONFIG[table.name]
  const column = {}
  if (config?.render?.[columnKey]) {
    column.render = (value, record) => {
      return React.createElement(config?.render?.[columnKey], { value, record })
    }
  }
  if (config?.filters?.includes(columnKey)) {
    column.filters = _.uniq(table.body.map(r => r[columnKey])).map(text => ({ text, value: text }))
    column.onFilter = (value, record) => record[columnKey] === value
  }
  if (config?.sorts?.includes(columnKey)) {
    column.sorter = (record1, record2) => sort(record1[columnKey], record2[columnKey])
  }

  return column
}

function StatusTag({ value }) {
  const map = {
    需求: 'default',
    开发: 'blue',
    联调: 'geekblue',
    测试: 'purple',
    发布: 'success',
    异常: 'error',
    暂停: 'warning'
  }
  return <Tag color={map[value]}>{value}</Tag>
}
function RequirementName({ value, record }) {
  const arr = []
  arr.push(record.link ? <Button type='link' size='small' href={record.link} target="_blank">{value}</Button> : value)
  if (record.luopanyi) arr.push(<Button type='link' size='small' shape='shape' href={record.luopanyi} target="_blank" icon={<img alt="" style={{verticalAlign: 'text-bottom'}} src="https://gw.alipayobjects.com/zos/rmsportal/eZxOZGVwnyYMqrEVQigx.ico" />} />)

  return <>{arr[0]}{arr[1]}</>
}

function Chart(props) {
  const { options, ...rest } = props
  const divRef = React.useRef()
  React.useEffect(() => {
    const chart = echarts.init(divRef.current)
    chart.setOption({
      legend: {},
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      ...options
    })
    return () => {
      chart.dispose()
    }
  }, [])
  return <div ref={divRef} style={{width: '100%', height: '400px'}} {...rest} />
}

function sort(k1, k2) {
  const t1 = typeof k1
  const t2 = typeof k2
  if (t1 !== t2) return sort(t1, t2)
  if (t1 === 'number') return k1 - k2
  if (t1 === 'string') {
    const cs1 = k1.split().map(c => c.charCodeAt(0))
    const cs2 = k2.split().map(c => c.charCodeAt(0))
    const len = Math.max(cs1.length, cs2.length)
    for (let i = 0; i < len; i++) {
      const c1 = cs1[i] || 0
      const c2 = cs2[i] || 0
      if (c1 < c2) return -1
      if (c1 > c2) return 1
    }
    return 0
  }
  return sort(t1, t2)
}

function useData() {
  const categoryLoadedRef = React.useRef(false)
  const [state, setState] = React.useState({
    loading: true,
    monthsOptions: [],
    selectedMonths: [],
    selectedTableName: '',
    dataList: [],
  })
  const update = (state) => setState((prevState) => ({ ...prevState, ...state }))

  React.useEffect(() => {
    loadMonthCategory().then(months => {
      const monthsOptions = months.map(m => ({ label: m, value: m }))
      const selectedMonths = months
      if (selectedMonths.length > 3) selectedMonths.length = 3
      categoryLoadedRef.current = true
      update({ monthsOptions, selectedMonths })
    })
  }, [])

  React.useEffect(() => {
    if (!categoryLoadedRef.current) return
    if (!state.loading) update({ loading: true })
    Promise.all(state.selectedMonths.map(loadMonthData))
      .then(dataList => {
        setState(prevState => {
          const selectedTableName = dataList.length && !prevState.selectedTableName
            ? dataList[0][ dataList[0][MENU_INDEX] ? MENU_INDEX : 0 ].name
            : (prevState.selectedTableName || '')

          return { ...prevState, dataList, loading: false, selectedTableName }
        })
      })
  }, [state.selectedMonths])

  return {
    ...state,
    setSelectedMonths: (selectedMonths) => update({ selectedMonths, loading: true }),
    setSelectedTableName: (selectedTableName) => update({ selectedTableName }),
  }
}

// 支付宝内网使用
function loadMonthCategory() {
  return load('https://renderofficedev.alipay.com/p/yuyan/pm-data_pm-category/zh_CN.json')
    .then(arr => {
      arr.forEach(it => {
        LOAD_CACHE[`./${it.date}.json`] = JSON.parse(it.content)
      })
      return arr.map(it => it.date)
    })
}
// 本地使用
// function loadMonthCategory() {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       resolve(['202205', '202204'])
//     }, 800)
//   })
// }
function loadMonthData(month) {
  return load(`./${month}.json`)
}
function load(url) {
  if (LOAD_CACHE[url]) return Promise.resolve(LOAD_CACHE[url])

  return fetch(url).then(res => {
    if (res.status === 200) {
      return res.json()
    } else {
      message.error(`请求 ${url} 失败，原因： ${res.status} ${res.statusText}`)
      throw res
    }
  }).then(data => {
    LOAD_CACHE[url] = data
    return data
  })
}
